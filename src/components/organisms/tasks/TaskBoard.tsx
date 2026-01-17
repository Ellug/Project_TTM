"use client";

import { useMemo, useState, type DragEvent } from "react";
import clsx from "clsx";
import type { Task, UserProfile } from "@/lib/types";
import { TaskCard } from "@/components/organisms/tasks/TaskCard";
import { Chip } from "@/components/atoms/Chip";
import { Panel } from "@/components/atoms/Panel";

type TaskBoardProps = {
  tasks: Task[];
  members: UserProfile[];
  statusOptions: Task["status"][];
  selectedTaskId: string | null;
  selectedTaskTitle?: string | null;
  canEdit: boolean;
  onSelect: (taskId: string) => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
};

export const TaskBoard = ({
  tasks,
  members,
  statusOptions,
  selectedTaskId,
  selectedTaskTitle,
  canEdit,
  onSelect,
  onUpdate,
}: TaskBoardProps) => {
  const [dragOverStatus, setDragOverStatus] = useState<Task["status"] | null>(
    null
  );

  const tasksByStatus = useMemo(
    () =>
      statusOptions.reduce<Record<string, Task[]>>((acc, status) => {
        acc[status] = tasks.filter((task) => task.status === status);
        return acc;
      }, {}),
    [tasks, statusOptions]
  );

  const isTaskDrag = (event: DragEvent<HTMLDivElement>) =>
    Boolean(
      event.dataTransfer?.types?.includes("application/x-ttm-task") ||
        event.dataTransfer?.types?.includes("text/plain")
    );

  const handleDragEnter =
    (status: Task["status"]) => (event: DragEvent<HTMLDivElement>) => {
      if (!canEdit || !isTaskDrag(event)) return;
      event.preventDefault();
      event.stopPropagation();
      setDragOverStatus(status);
    };

  const handleDragLeave =
    (status: Task["status"]) => (event: DragEvent<HTMLDivElement>) => {
      if (!canEdit) return;
      event.stopPropagation();
      const relatedTarget = event.relatedTarget as Node | null;
      if (relatedTarget && event.currentTarget.contains(relatedTarget)) {
        return;
      }
      if (dragOverStatus === status) {
        setDragOverStatus(null);
      }
    };

  const handleDragOver =
    (status: Task["status"]) => (event: DragEvent<HTMLDivElement>) => {
      if (!canEdit || !isTaskDrag(event)) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
      setDragOverStatus(status);
    };

  const handleDrop =
    (status: Task["status"]) => async (event: DragEvent<HTMLDivElement>) => {
      if (!canEdit || !isTaskDrag(event)) return;
      event.preventDefault();
      event.stopPropagation();
      setDragOverStatus(null);
      const raw =
        event.dataTransfer?.getData("application/x-ttm-task") ||
        event.dataTransfer?.getData("text/plain");
      if (!raw) return;
      let taskId = raw;
      try {
        const parsed = JSON.parse(raw) as { id?: string };
        if (parsed?.id) {
          taskId = parsed.id;
        }
      } catch {
        // Ignore non-JSON payloads.
      }
      const task = tasks.find((item) => item.id === taskId);
      if (!task) return;
      if (task.status === status) return;
      try {
        await onUpdate(task.id, {
          status,
          completed: status === "Done",
        });
      } catch {
        // Ignore drop update errors.
      }
    };

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted)]">
        <span>{tasks.length} tasks matched</span>
        {selectedTaskTitle ? (
          <Chip>Editing: {selectedTaskTitle}</Chip>
        ) : (
          <span>Click a task to open details.</span>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statusOptions.map((status, index) => (
          <div
            key={status}
            className={clsx(
              "task-column min-w-[280px] flex-1 animate-fade-in",
              dragOverStatus === status && "task-column-drop"
            )}
            style={{ animationDelay: `${index * 80}ms` }}
            onDragEnter={handleDragEnter(status)}
            onDragOver={handleDragOver(status)}
            onDragLeave={handleDragLeave(status)}
            onDrop={handleDrop(status)}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text)]">
                {status}
              </h3>
              <Chip>{tasksByStatus[status]?.length || 0}</Chip>
            </div>
            <div className="task-column-list grid gap-3">
              {tasksByStatus[status]?.length ? (
                tasksByStatus[status].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    members={members}
                    onUpdate={onUpdate}
                    canEdit={canEdit}
                    onSelect={onSelect}
                    isSelected={selectedTaskId === task.id}
                    onDragEnd={() => setDragOverStatus(null)}
                  />
                ))
              ) : (
                <Panel className="p-4 text-xs text-[var(--muted)]">
                  No tasks here yet. Create one above.
                </Panel>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
