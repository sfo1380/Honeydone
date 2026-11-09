"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { completeTaskAction, undoTaskAction } from "@/app/actions/chores";

export type TaskView = {
  id: string;
  choreId: string;
  title: string;
  dueLabel: string;
  overdue: boolean;
  time: string | null;
  effort: "SMALL" | "MEDIUM" | "LARGE";
  done: boolean;
  doneBy: string | null;
  late: boolean;
  owner: { name: string; color: string } | null;
  actionable: boolean;
};

const EFFORT_LABEL = { SMALL: "S", MEDIUM: "M", LARGE: "L" } as const;

export function TaskItem({ task }: { task: TaskView }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useOptimistic(task.done);

  const toggle = () =>
    start(async () => {
      setDone(!done);
      await (done ? undoTaskAction(task.id) : completeTaskAction(task.id));
    });

  return (
    <li className={`flex items-center gap-3 px-3 py-3 ${task.actionable ? "" : "opacity-60"}`}>
      {task.actionable ? (
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          role="checkbox"
          aria-checked={done}
          aria-label={done ? `Mark "${task.title}" not done` : `Mark "${task.title}" done`}
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition ${
            done ? "border-success bg-success text-white" : "border-line hover:border-honey"
          }`}
        >
          {done && <span aria-hidden>✓</span>}
        </button>
      ) : (
        <span aria-hidden className="h-7 w-7 shrink-0 rounded-full border-2 border-dashed border-line" />
      )}
      <div className="min-w-0 flex-1">
        <Link
          href={`/chores/${task.choreId}`}
          className={`block truncate font-medium hover:underline ${done ? "text-muted line-through" : ""}`}
        >
          {task.title}
        </Link>
        <p className="text-sm text-muted">
          {done ? (
            <>
              Done{task.doneBy ? ` by ${task.doneBy}` : ""}
              {task.late ? " (late)" : ""}
            </>
          ) : (
            <>
              <span className={task.overdue ? "font-semibold text-danger" : ""}>{task.dueLabel}</span>
              {task.time ? ` · ${task.time}` : ""}
              {!task.actionable ? " · upcoming" : ""}
            </>
          )}
        </p>
      </div>
      <span
        title={`Effort: ${task.effort.toLowerCase()}`}
        className="shrink-0 rounded-md border border-line px-1.5 text-xs font-semibold text-muted"
      >
        {EFFORT_LABEL[task.effort]}
      </span>
      {task.owner ? (
        <span
          title={task.owner.name}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: task.owner.color }}
        >
          {task.owner.name.slice(0, 1).toUpperCase()}
        </span>
      ) : (
        <span title="Either of you" className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line text-xs text-muted">
          ⇄
        </span>
      )}
    </li>
  );
}

export function TaskList({ tasks, empty }: { tasks: TaskView[]; empty?: string }) {
  if (!tasks.length) return empty ? <p className="px-3 py-3 text-sm text-muted">{empty}</p> : null;
  return (
    <ul className="divide-y divide-line">
      {tasks.map((t) => (
        <TaskItem key={`${t.id}-${t.dueLabel}-${t.actionable}`} task={t} />
      ))}
    </ul>
  );
}
