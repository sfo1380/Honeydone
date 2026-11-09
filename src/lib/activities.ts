import "server-only";
import type { EventKind, Prisma } from "@prisma/client";
import { db } from "./db";
import { fromDateStr, toDateStr, type DateStr } from "./dates";
import { datesOnWeekdays } from "./season";

export type ActivityInput = {
  kidId: string;
  name: string;
  team: string | null;
  coachName: string | null;
  coachContact: string | null;
  location: string | null;
  seasonStart: DateStr;
  seasonEnd: DateStr;
  bringList: string[];
  notes: string | null;
};

export type ScheduleInput = {
  kind: EventKind;
  weekdays: number[];
  startTime: string;
  endTime: string | null;
  location: string | null;
  defaultDropOffId: string | null;
  defaultPickUpId: string | null;
};

export type EventInput = {
  kind: EventKind;
  title: string | null;
  date: DateStr;
  startTime: string;
  endTime: string | null;
  location: string | null;
  notes: string | null;
  dropOffId: string | null;
  pickUpId: string | null;
  cancelled: boolean;
};

type Tx = Prisma.TransactionClient;

async function memberIds(householdId: string) {
  return new Set((await db.user.findMany({ where: { householdId }, select: { id: true } })).map((u) => u.id));
}

/** Drops any driver id that isn't a partner in this household. */
function onlyMembers<T extends Record<string, unknown>>(members: Set<string>, data: T, keys: (keyof T)[]): T {
  const out = { ...data };
  for (const k of keys) {
    const v = out[k];
    if (typeof v === "string" && !members.has(v)) (out as Record<string, unknown>)[k as string] = null;
  }
  return out;
}

/**
 * Makes a weekly schedule's events match its rule from `today` to the end of the season.
 * Past events are left alone. Upcoming events keep their drivers and notes, and events someone
 * edited by hand (moved, retimed) are never overwritten.
 */
async function syncSchedule(tx: Tx, scheduleId: string, today: DateStr) {
  const schedule = await tx.activitySchedule.findUniqueOrThrow({ where: { id: scheduleId }, include: { activity: true } });
  const { activity } = schedule;
  const start = toDateStr(activity.seasonStart) > today ? toDateStr(activity.seasonStart) : today;
  const wanted = new Set(datesOnWeekdays(schedule.weekdays, start, toDateStr(activity.seasonEnd)));
  const upcoming = { scheduleId, slotDate: { gte: fromDateStr(today) } };

  const existing = await tx.activityEvent.findMany({ where: upcoming });
  const stale = existing.filter((e) => !e.customized && !wanted.has(toDateStr(e.slotDate!))).map((e) => e.id);
  if (stale.length) await tx.activityEvent.deleteMany({ where: { id: { in: stale } } });

  const shared = { kind: schedule.kind, startTime: schedule.startTime, endTime: schedule.endTime, location: schedule.location };
  await tx.activityEvent.updateMany({ where: { ...upcoming, customized: false }, data: shared });

  const have = new Set(existing.map((e) => toDateStr(e.slotDate!)));
  const create = [...wanted].filter((d) => !have.has(d));
  if (create.length) {
    await tx.activityEvent.createMany({
      data: create.map((d) => ({
        ...shared,
        activityId: activity.id,
        householdId: activity.householdId,
        scheduleId,
        slotDate: fromDateStr(d),
        date: fromDateStr(d),
        dropOffId: schedule.defaultDropOffId,
        pickUpId: schedule.defaultPickUpId,
      })),
      skipDuplicates: true,
    });
  }
}

export async function createActivity(householdId: string, input: ActivityInput) {
  const kid = await db.kid.findFirst({ where: { id: input.kidId, householdId } });
  if (!kid) return null;
  const { seasonStart, seasonEnd, ...rest } = input;
  return db.activity.create({
    data: { ...rest, householdId, seasonStart: fromDateStr(seasonStart), seasonEnd: fromDateStr(seasonEnd) },
  });
}

export async function updateActivity(householdId: string, activityId: string, input: ActivityInput, today: DateStr) {
  const kid = await db.kid.findFirst({ where: { id: input.kidId, householdId } });
  if (!kid) return null;
  const { seasonStart, seasonEnd, ...rest } = input;
  return db.$transaction(async (tx) => {
    const { count } = await tx.activity.updateMany({
      where: { id: activityId, householdId },
      data: { ...rest, seasonStart: fromDateStr(seasonStart), seasonEnd: fromDateStr(seasonEnd) },
    });
    if (!count) return null;
    // The season may have moved, so every weekly schedule is re-laid.
    const schedules = await tx.activitySchedule.findMany({ where: { activityId }, select: { id: true } });
    for (const s of schedules) await syncSchedule(tx, s.id, today);
    return tx.activity.findUnique({ where: { id: activityId } });
  });
}

export async function deleteActivity(householdId: string, activityId: string) {
  await db.activity.deleteMany({ where: { id: activityId, householdId } });
}

export async function addSchedule(householdId: string, activityId: string, input: ScheduleInput, today: DateStr) {
  const activity = await db.activity.findFirst({ where: { id: activityId, householdId } });
  if (!activity) return null;
  const data = onlyMembers(await memberIds(householdId), input, ["defaultDropOffId", "defaultPickUpId"]);
  return db.$transaction(async (tx) => {
    const schedule = await tx.activitySchedule.create({ data: { ...data, activityId } });
    await syncSchedule(tx, schedule.id, today);
    return schedule;
  });
}

/** Removes a weekly slot and its upcoming events. Past events stay. */
export async function removeSchedule(householdId: string, scheduleId: string, today: DateStr) {
  const schedule = await db.activitySchedule.findFirst({ where: { id: scheduleId, activity: { householdId } } });
  if (!schedule) return;
  await db.$transaction([
    db.activityEvent.deleteMany({
      where: { scheduleId, OR: [{ date: { gte: fromDateStr(today) } }, { slotDate: { gte: fromDateStr(today) } }] },
    }),
    db.activitySchedule.delete({ where: { id: scheduleId } }),
  ]);
}

export async function addEvent(householdId: string, activityId: string, input: EventInput) {
  const activity = await db.activity.findFirst({ where: { id: activityId, householdId } });
  if (!activity) return null;
  const data = onlyMembers(await memberIds(householdId), input, ["dropOffId", "pickUpId"]);
  return db.activityEvent.create({ data: { ...data, date: fromDateStr(input.date), activityId, householdId } });
}

/**
 * Edits one event. Changing its date, time, place or type marks it as customized, so later changes
 * to its weekly schedule don't undo the edit.
 */
export async function updateEvent(householdId: string, eventId: string, input: EventInput) {
  const event = await db.activityEvent.findFirst({ where: { id: eventId, householdId } });
  if (!event) return null;
  const data = onlyMembers(await memberIds(householdId), input, ["dropOffId", "pickUpId"]);
  const customized =
    event.customized ||
    toDateStr(event.date) !== input.date ||
    event.startTime !== input.startTime ||
    event.endTime !== input.endTime ||
    event.location !== input.location ||
    event.kind !== input.kind;
  return db.activityEvent.update({
    where: { id: eventId },
    data: { ...data, date: fromDateStr(input.date), customized },
  });
}

export async function setDriver(householdId: string, eventId: string, role: "dropOff" | "pickUp", userId: string | null) {
  if (userId && !(await memberIds(householdId)).has(userId)) return;
  await db.activityEvent.updateMany({
    where: { id: eventId, householdId },
    data: role === "dropOff" ? { dropOffId: userId } : { pickUpId: userId },
  });
}

export async function deleteEvent(householdId: string, eventId: string) {
  await db.activityEvent.deleteMany({ where: { id: eventId, householdId } });
}

export async function eventsBetween(householdId: string, from: DateStr, to: DateStr, kidId?: string) {
  return db.activityEvent.findMany({
    where: {
      householdId,
      date: { gte: fromDateStr(from), lte: fromDateStr(to) },
      ...(kidId ? { activity: { kidId } } : {}),
    },
    include: { activity: { include: { kid: true } } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export type EventWithActivity = Awaited<ReturnType<typeof eventsBetween>>[number];

/** Upcoming, not cancelled events missing a driver either way. */
export function needsDriver(e: { cancelled: boolean; dropOffId: string | null; pickUpId: string | null }) {
  return !e.cancelled && (!e.dropOffId || !e.pickUpId);
}
