import "server-only";
import type { Chore, ChoreTask } from "@prisma/client";
import { db } from "./db";
import { fromDateStr, todayIn, toDateStr, type DateStr } from "./dates";
import { firstDue, nextDue, type RepeatRule } from "./repeat";
import { STARTER_CHORES } from "./chore-catalog";

export type ChoreInput = {
  title: string;
  notes: string | null;
  category: string;
  effort: "SMALL" | "MEDIUM" | "LARGE";
  ownerId: string | null;
  rotate: boolean;
  repeat: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
  interval: number;
  weekdays: number[];
  startDate: DateStr;
  dueTime: string | null;
};

export function ruleOf(chore: Pick<Chore, "repeat" | "interval" | "weekdays" | "startDate">): RepeatRule {
  return { repeat: chore.repeat, interval: chore.interval, weekdays: chore.weekdays, startDate: toDateStr(chore.startDate) };
}

/** Who does the next one: the other partner when the chore rotates. */
export function nextAssignee(
  chore: Pick<Chore, "rotate">,
  current: string | null,
  memberIds: string[],
): string | null {
  if (!chore.rotate || !current) return current;
  return memberIds.find((id) => id !== current) ?? current;
}

async function memberIds(householdId: string) {
  const members = await db.user.findMany({ where: { householdId }, select: { id: true }, orderBy: { createdAt: "asc" } });
  return members.map((m) => m.id);
}

async function assertMember(householdId: string, userId: string | null) {
  if (!userId) return;
  const ok = await db.user.count({ where: { id: userId, householdId } });
  if (!ok) throw new Error("That person isn't in this household.");
}

export async function createChore(householdId: string, input: ChoreInput) {
  await assertMember(householdId, input.ownerId);
  const { startDate, ...rest } = input;
  return db.$transaction(async (tx) => {
    const chore = await tx.chore.create({ data: { ...rest, householdId, startDate: fromDateStr(startDate) } });
    await tx.choreTask.create({
      data: { choreId: chore.id, householdId, dueDate: fromDateStr(firstDue(ruleOf(chore))), assigneeId: chore.ownerId },
    });
    return chore;
  });
}

/** Saves changes and restarts the schedule from the given next-due date. Past completions are kept. */
export async function updateChore(householdId: string, choreId: string, input: ChoreInput) {
  await assertMember(householdId, input.ownerId);
  const { startDate, ...rest } = input;
  return db.$transaction(async (tx) => {
    const { count } = await tx.chore.updateMany({
      where: { id: choreId, householdId, archived: false },
      data: { ...rest, startDate: fromDateStr(startDate) },
    });
    if (!count) return null;
    const chore = await tx.chore.findUniqueOrThrow({ where: { id: choreId } });
    await tx.choreTask.deleteMany({ where: { choreId, completedAt: null } });
    const due = fromDateStr(firstDue(ruleOf(chore)));
    // A completed task may already sit on that date; then the chore is done for that day.
    await tx.choreTask.upsert({
      where: { choreId_dueDate: { choreId, dueDate: due } },
      update: {},
      create: { choreId, householdId, dueDate: due, assigneeId: chore.ownerId },
    });
    return chore;
  });
}

/** Removes a chore from the lists. Completed history stays for the reward tracker. */
export async function archiveChore(householdId: string, choreId: string) {
  await db.$transaction([
    db.chore.updateMany({ where: { id: choreId, householdId }, data: { archived: true } }),
    db.choreTask.deleteMany({ where: { choreId, householdId, completedAt: null } }),
  ]);
}

export async function completeTask(householdId: string, taskId: string, userId: string, now = new Date()) {
  const household = await db.household.findUniqueOrThrow({ where: { id: householdId }, select: { timeZone: true } });
  const ids = await memberIds(householdId);
  const today = todayIn(household.timeZone, now);

  return db.$transaction(async (tx) => {
    const task = await tx.choreTask.findFirst({ where: { id: taskId, householdId }, include: { chore: true } });
    if (!task) return null;
    const { count } = await tx.choreTask.updateMany({
      where: { id: taskId, completedAt: null },
      data: {
        completedAt: now,
        completedOn: fromDateStr(today),
        completedById: userId,
        onTime: today <= toDateStr(task.dueDate),
      },
    });
    if (!count || task.chore.archived) return task; // already done (e.g. by the partner a moment ago)

    const next = nextDue(ruleOf(task.chore), toDateStr(task.dueDate));
    if (next) {
      await tx.choreTask.upsert({
        where: { choreId_dueDate: { choreId: task.choreId, dueDate: fromDateStr(next) } },
        update: {},
        create: {
          choreId: task.choreId,
          householdId,
          dueDate: fromDateStr(next),
          assigneeId: nextAssignee(task.chore, task.assigneeId, ids),
        },
      });
    }
    return task;
  });
}

/** Marks a task not done again and removes the follow-up task it created, if nobody has done that one yet. */
export async function undoTask(householdId: string, taskId: string) {
  return db.$transaction(async (tx) => {
    const task = await tx.choreTask.findFirst({ where: { id: taskId, householdId }, include: { chore: true } });
    if (!task?.completedAt) return null;
    await tx.choreTask.update({
      where: { id: taskId },
      data: { completedAt: null, completedOn: null, completedById: null, onTime: null },
    });
    const next = nextDue(ruleOf(task.chore), toDateStr(task.dueDate));
    if (next) {
      await tx.choreTask.deleteMany({ where: { choreId: task.choreId, dueDate: fromDateStr(next), completedAt: null } });
    }
    return task;
  });
}

export async function addStarterChores(householdId: string, keys: string[], startDate: DateStr) {
  const picks = STARTER_CHORES.filter((c) => keys.includes(c.key));
  const existing = new Set(
    (await db.chore.findMany({ where: { householdId, archived: false }, select: { title: true } })).map((c) => c.title),
  );
  let added = 0;
  for (const c of picks) {
    if (existing.has(c.title)) continue;
    await createChore(householdId, {
      title: c.title,
      notes: null,
      category: c.category,
      effort: c.effort,
      ownerId: null,
      rotate: false,
      repeat: c.repeat,
      interval: c.interval ?? 1,
      weekdays: c.weekdays ?? [],
      startDate,
      dueTime: null,
    });
    added++;
  }
  return added;
}

export type TaskWithChore = ChoreTask & { chore: Chore };

/** Open tasks due on or before `through`, plus tasks completed on `today`. */
export async function tasksForToday(householdId: string, today: DateStr) {
  const [open, done] = await Promise.all([
    db.choreTask.findMany({
      where: { householdId, completedAt: null, dueDate: { lte: fromDateStr(today) }, chore: { archived: false } },
      include: { chore: true },
      orderBy: [{ dueDate: "asc" }, { chore: { dueTime: "asc" } }, { chore: { title: "asc" } }],
    }),
    db.choreTask.findMany({
      where: { householdId, completedOn: fromDateStr(today) },
      include: { chore: true },
      orderBy: { completedAt: "asc" },
    }),
  ]);
  return { open, done };
}

/** Every open task (each active chore has exactly one), for projecting the week ahead. */
export async function openTasks(householdId: string) {
  return db.choreTask.findMany({
    where: { householdId, completedAt: null, chore: { archived: false } },
    include: { chore: true },
    orderBy: [{ dueDate: "asc" }, { chore: { title: "asc" } }],
  });
}

export type Projected = { task: TaskWithChore; date: DateStr; assigneeId: string | null; actionable: boolean };

/**
 * Lays each chore's upcoming due dates over [from, to]. Only the real open task can be checked off;
 * later repeats are shown as upcoming. An overdue open task keeps its past date.
 */
export function projectTasks(tasks: TaskWithChore[], from: DateStr, to: DateStr, memberIdList: string[]): Projected[] {
  const out: Projected[] = [];
  for (const task of tasks) {
    let date: DateStr | null = toDateStr(task.dueDate);
    let assignee = task.assigneeId;
    let first = true;
    let guard = 0;
    while (date && date <= to && guard++ < 400) {
      if (date >= from || first) out.push({ task, date, assigneeId: assignee, actionable: first });
      first = false;
      date = nextDue(ruleOf(task.chore), date);
      assignee = nextAssignee(task.chore, assignee, memberIdList);
    }
  }
  return out;
}
