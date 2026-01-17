"use client";

import { useMemo, useRef, type DragEvent } from "react";
import clsx from "clsx";
import type { Task, UserProfile } from "@/lib/types";
import { Avatar } from "@/components/atoms/Avatar";
import { Chip } from "@/components/atoms/Chip";
import { toDateString } from "@/lib/utils";

type TaskCardProps = {
  task: Task;
  members: UserProfile[];
  isSelected: boolean;
  canEdit: boolean;
  onSelect: (taskId: string) => void;
  onDragEnd: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDragOverCard?: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeaveCard?: (event: DragEvent<HTMLDivElement>) => void;
  onDropOnCard?: (event: DragEvent<HTMLDivElement>) => void;
  dragPosition?: "before" | "after" | null;
};

export const TaskCard = ({
  task,
  members,
  isSelected,
  canEdit,
  onSelect,
  onDragEnd,
  onUpdate,
  onDragOverCard,
  onDragLeaveCard,
  onDropOnCard,
  dragPosition,
}: TaskCardProps) => {
  const assignedMembers = useMemo(
    () => members.filter((member) => task.assigneeIds.includes(member.uid)),
    [members, task.assigneeIds]
  );
  const draggingRef = useRef(false);

  const isTaskDrag = (event: DragEvent<HTMLDivElement>) =>
    Boolean(
      event.dataTransfer?.types?.includes("application/x-ttm-task") ||
        event.dataTransfer?.types?.includes("text/plain")
    );

  const visibleMembers = assignedMembers.slice(0, 3);
  const extraMembers = Math.max(assignedMembers.length - visibleMembers.length, 0);
  const visibleLabels = task.labels.slice(0, 2);
  const extraLabels = Math.max(task.labels.length - visibleLabels.length, 0);

  return (
    <div
      className={clsx(
        "task-card",
        isSelected && "task-card-selected",
        dragPosition === "before" && "task-card-drop-before",
        dragPosition === "after" && "task-card-drop-after"
      )}
      role="button"
      tabIndex={0}
      draggable={canEdit}
      onDragStart={(event) => {
        if (!canEdit) {
          event.preventDefault();
          return;
        }
        const target = event.target as HTMLElement | null;
        if (target?.closest("input, button, textarea, select")) {
          event.preventDefault();
          return;
        }
        if (!event.dataTransfer) return;
        draggingRef.current = true;
        event.dataTransfer.setData(
          "application/x-ttm-task",
          JSON.stringify({ id: task.id, status: task.status })
        );
        event.dataTransfer.setData("text/plain", task.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => {
        draggingRef.current = false;
        onDragEnd();
      }}
      onDragOver={(event) => {
        if (!canEdit || !isTaskDrag(event)) return;
        event.preventDefault();
        event.stopPropagation();
        onDragOverCard?.(event);
      }}
      onDragLeave={(event) => {
        if (!canEdit) return;
        event.stopPropagation();
        onDragLeaveCard?.(event);
      }}
      onDrop={(event) => {
        if (!canEdit || !isTaskDrag(event)) return;
        event.preventDefault();
        event.stopPropagation();
        onDropOnCard?.(event);
      }}
      onClick={() => {
        if (draggingRef.current) return;
        onSelect(task.id);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(task.id);
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={task.completed}
            className="mt-1 h-4 w-4 accent-[var(--accent)]"
            draggable={false}
            disabled={!canEdit}
            onClick={(event) => event.stopPropagation()}
            onChange={async (event) => {
              if (!canEdit) return;
              await onUpdate(task.id, {
                completed: event.target.checked,
                status: event.target.checked ? "Done" : "Backlog",
              });
            }}
          />
          <div className="grid gap-2">
            <p
              className={clsx(
                "text-sm font-semibold text-[var(--text)]"
              )}
            >
              {task.title}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
              <Chip>{task.status}</Chip>
              <Chip>{task.priority}</Chip>
              {task.dueDate && <span>Due {toDateString(task.dueDate)}</span>}
            </div>
          </div>
        </div>
        {task.assigneeIds.length > 0 && (
          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
            {task.assigneeIds.length} assigned
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
        <div className="flex items-center gap-2">
          {visibleMembers.length === 0 ? (
            <span>Unassigned</span>
          ) : (
            <>
              {visibleMembers.map((member) => (
                <Avatar
                  key={member.uid}
                  name={member.nickname || member.displayName || "User"}
                  src={member.photoURL}
                  size="sm"
                />
              ))}
              {extraMembers > 0 && <Chip>+{extraMembers}</Chip>}
            </>
          )}
        </div>
        {task.labels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {visibleLabels.map((label) => (
              <Chip key={label}>{label}</Chip>
            ))}
            {extraLabels > 0 && <Chip>+{extraLabels}</Chip>}
          </div>
        )}
      </div>
    </div>
  );
};
