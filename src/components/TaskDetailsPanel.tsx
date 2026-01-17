"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import clsx from "clsx";
import { taskPriorities, taskStatuses } from "@/lib/constants";
import type { Task, UserProfile } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { toDateString } from "@/lib/utils";
import { remarkDanger } from "@/lib/remark-danger";

type TaskDetailsPanelProps = {
  task: Task | null;
  members: UserProfile[];
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onClose: () => void;
};

export const TaskDetailsPanel = ({
  task,
  members,
  onUpdate,
  onClose,
}: TaskDetailsPanelProps) => {
  const [title, setTitle] = useState(task?.title ?? "");
  const [labelsInput, setLabelsInput] = useState(
    task?.labels.join(", ") ?? ""
  );
  const [description, setDescription] = useState(task?.description ?? "");
  const [detailsMode, setDetailsMode] = useState<"preview" | "edit">(
    "preview"
  );
  const [saving, setSaving] = useState(false);

  const previousTaskId = useRef<string | null>(null);

  useEffect(() => {
    if (!task) return;
    if (previousTaskId.current === task.id) return;
    previousTaskId.current = task.id;
    setTitle(task.title);
    setLabelsInput(task.labels.join(", "));
    setDescription(task.description);
    setDetailsMode("preview");
  }, [task]);

  const assignedMembers = useMemo(
    () =>
      task
        ? members.filter((member) => task.assigneeIds.includes(member.uid))
        : [],
    [members, task]
  );

  const handleTitleCommit = async () => {
    if (!task) return;
    if (!title.trim()) {
      setTitle(task.title);
      return;
    }
    if (title.trim() !== task.title) {
      await onUpdate(task.id, { title: title.trim() });
    }
  };

  const handleLabelsCommit = async () => {
    if (!task) return;
    const labels = labelsInput
      .split(",")
      .map((label) => label.trim())
      .filter(Boolean);
    const uniqueLabels = Array.from(new Set(labels));
    setLabelsInput(uniqueLabels.join(", "));
    if (uniqueLabels.join("|") !== task.labels.join("|")) {
      await onUpdate(task.id, { labels: uniqueLabels });
    }
  };

  const handleToggleAssignee = async (uid: string) => {
    if (!task) return;
    const updated = task.assigneeIds.includes(uid)
      ? task.assigneeIds.filter((id) => id !== uid)
      : [...task.assigneeIds, uid];
    await onUpdate(task.id, { assigneeIds: updated });
  };

  const handleSaveDescription = async () => {
    if (!task) return;
    setSaving(true);
    try {
      await onUpdate(task.id, { description });
      setDetailsMode("preview");
    } finally {
      setSaving(false);
    }
  };

  if (!task) {
    return (
      <aside className="task-panel" aria-label="Task details">
        <div className="task-panel-inner">
          <div className="panel p-4 text-sm text-[var(--muted)]">
            Select a task card to view details.
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="task-panel" aria-label="Task details">
      <div className="task-panel-inner">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
              Task panel
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--text)]">
              Task details
            </h2>
          </div>
          <button
            className="btn-ghost text-xs uppercase tracking-[0.2em]"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="panel p-4">
          <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Title
            <input
              className="input-field text-sm"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={handleTitleCommit}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
            />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Status
              <select
                className="input-field text-sm uppercase tracking-[0.1em]"
                value={task.status}
                onChange={(event) =>
                  onUpdate(task.id, {
                    status: event.target.value as Task["status"],
                    completed: event.target.value === "Done",
                  })
                }
              >
                {taskStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Priority
              <select
                className="input-field text-sm uppercase tracking-[0.1em]"
                value={task.priority}
                onChange={(event) =>
                  onUpdate(task.id, {
                    priority: event.target.value as Task["priority"],
                  })
                }
              >
                {taskPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Due date
              <input
                className="input-field text-sm"
                type="date"
                value={task.dueDate || ""}
                onChange={(event) =>
                  onUpdate(task.id, { dueDate: event.target.value })
                }
              />
            </label>
            <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Labels
              <input
                className="input-field text-sm"
                value={labelsInput}
                onChange={(event) => setLabelsInput(event.target.value)}
                onBlur={handleLabelsCommit}
                placeholder="combat, ui, fx"
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={task.completed}
                className="h-4 w-4 accent-[var(--accent)]"
                onChange={(event) =>
                  onUpdate(task.id, {
                    completed: event.target.checked,
                    status: event.target.checked ? "Done" : "Backlog",
                  })
                }
              />
              Completed
            </label>
            <span>Updated {toDateString(task.updatedAt)}</span>
          </div>
        </div>

        <div className="panel p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Assignees
            </p>
            <span className="chip">{assignedMembers.length} assigned</span>
          </div>
          <div className="mt-3 grid gap-2">
            {members.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">
                No members loaded yet.
              </p>
            ) : (
              members.map((member) => (
                <label
                  key={member.uid}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)]"
                >
                  <span className="flex items-center gap-2">
                    <Avatar
                      name={member.nickname || member.displayName || "User"}
                      src={member.photoURL}
                      size="sm"
                    />
                    {member.nickname || member.displayName || "User"}
                  </span>
                  <input
                    type="checkbox"
                    checked={task.assigneeIds.includes(member.uid)}
                    className="h-4 w-4 accent-[var(--accent)]"
                    onChange={() => handleToggleAssignee(member.uid)}
                  />
                </label>
              ))
            )}
          </div>
        </div>

        <div className="panel markdown-panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Details
              </p>
              <span className="chip">Markdown</span>
            </div>
            <div className="flex gap-2">
              <button
                className={clsx(
                  "btn-ghost text-xs uppercase tracking-[0.2em]",
                  detailsMode === "preview" && "text-[var(--text)]"
                )}
                onClick={() => setDetailsMode("preview")}
              >
                Preview
              </button>
              <button
                className={clsx(
                  "btn-ghost text-xs uppercase tracking-[0.2em]",
                  detailsMode === "edit" && "text-[var(--text)]"
                )}
                onClick={() => setDetailsMode("edit")}
              >
                Edit
              </button>
            </div>
          </div>
          {detailsMode === "edit" ? (
            <textarea
              className="input-field markdown-input mt-3 text-xs"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Write markdown details..."
            />
          ) : (
            <div className="markdown mt-3 text-sm text-[var(--text)]">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkDanger]}>
                {description || "No details yet. Switch to edit mode."}
              </ReactMarkdown>
            </div>
          )}
              {detailsMode === "edit" && (
                <div className="mt-3 flex items-center gap-3">
                  <button
                    className="btn-primary text-xs"
                    onClick={handleSaveDescription}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save details"}
                  </button>
                  <span className="text-xs text-[var(--muted)]">
                    Preview supports tables, checklists, code blocks, and %%alert%%.
                  </span>
                </div>
              )}
        </div>
      </div>
    </aside>
  );
};
