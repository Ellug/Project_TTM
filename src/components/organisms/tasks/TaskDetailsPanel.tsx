"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { taskLabels, taskPriorities, taskStatuses, type TaskLabel } from "@/lib/constants";
import type { Task, UserProfile } from "@/lib/types";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Chip } from "@/components/atoms/Chip";
import { InputField } from "@/components/atoms/InputField";
import { Panel } from "@/components/atoms/Panel";
import { SelectField } from "@/components/atoms/SelectField";
import { FormField } from "@/components/molecules/FormField";
import { MarkdownEditorPanel } from "@/components/molecules/MarkdownEditorPanel";
import { toDateString } from "@/lib/utils";

const resolveTaskLabel = (labels: string[]) => {
  const match = labels.find((label) =>
    taskLabels.includes(label as TaskLabel)
  );
  return match ?? "";
};

type TaskDetailsPanelProps = {
  task: Task | null;
  members: UserProfile[];
  canEdit: boolean;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onClose: () => void;
};

export const TaskDetailsPanel = ({
  task,
  members,
  canEdit,
  onUpdate,
  onDelete,
  onClose,
}: TaskDetailsPanelProps) => {
  const [title, setTitle] = useState(task?.title ?? "");
  const [selectedLabel, setSelectedLabel] = useState(() =>
    resolveTaskLabel(task?.labels ?? [])
  );
  const [description, setDescription] = useState(task?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const previousTaskId = useRef<string | null>(null);

  useEffect(() => {
    if (!task) return;
    if (previousTaskId.current === task.id) return;
    previousTaskId.current = task.id;
    setTitle(task.title);
    setSelectedLabel(resolveTaskLabel(task.labels));
    setDescription(task.description);
  }, [task]);

  const assignedMembers = useMemo(
    () =>
      task
        ? members.filter((member) => task.assigneeIds.includes(member.uid))
        : [],
    [members, task]
  );

  const handleTitleCommit = async () => {
    if (!task || !canEdit) return;
    if (!title.trim()) {
      setTitle(task.title);
      return;
    }
    if (title.trim() !== task.title) {
      await onUpdate(task.id, { title: title.trim() });
    }
  };

  const handleLabelChange = async (nextLabel: string) => {
    if (!task || !canEdit) return;
    const normalized = nextLabel ? [nextLabel] : [];
    const currentLabel = resolveTaskLabel(task.labels);
    if (currentLabel === nextLabel && task.labels.length <= 1) {
      return;
    }
    setSelectedLabel(nextLabel);
    await onUpdate(task.id, { labels: normalized });
  };

  const handleToggleAssignee = async (uid: string) => {
    if (!task || !canEdit) return;
    const updated = task.assigneeIds.includes(uid)
      ? task.assigneeIds.filter((id) => id !== uid)
      : [...task.assigneeIds, uid];
    await onUpdate(task.id, { assigneeIds: updated });
  };

  const handleSaveDescription = async () => {
    if (!task || !canEdit) return;
    setSaving(true);
    try {
      await onUpdate(task.id, { description });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task || deleting || !canEdit) return;
    const confirmed = window.confirm(
      `Delete "${task.title}"? This cannot be undone.`
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      await onDelete(task.id);
      onClose();
    } catch {
      // Ignore delete errors for now.
    } finally {
      setDeleting(false);
    }
  };

  if (!task) {
    return (
      <aside className="task-panel" aria-label="Task details">
        <div className="task-panel-inner">
          <Panel className="p-4 text-sm text-[var(--muted)]">
            Select a task card to view details.
          </Panel>
        </div>
      </aside>
    );
  }

  return (
    <aside className="task-panel" aria-label="Task details">
      <div className="task-panel-inner">
        <Panel className="p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
              Task
            </p>
            <div className="flex items-center gap-2">
              {!canEdit && <Chip>Read-only</Chip>}
              {canEdit && (
                <Button
                  variant="ghost"
                  className="text-[11px] uppercase tracking-[0.2em]"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              )}
              <Button
                variant="ghost"
                className="text-[11px] uppercase tracking-[0.2em]"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
          <FormField
            label="Title"
            labelClassName="text-xs uppercase tracking-[0.2em] text-[var(--muted)]"
          >
            <InputField
              className="text-sm"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={handleTitleCommit}
              readOnly={!canEdit}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
            />
          </FormField>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <FormField
              label="Status"
              labelClassName="text-xs uppercase tracking-[0.2em] text-[var(--muted)]"
            >
              <SelectField
                className="text-sm uppercase tracking-[0.1em]"
                value={task.status}
                onChange={(event) => {
                  if (!canEdit) return;
                  onUpdate(task.id, {
                    status: event.target.value as Task["status"],
                    completed: event.target.value === "Done",
                  });
                }}
                disabled={!canEdit}
              >
                {taskStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </SelectField>
            </FormField>
            <FormField
              label="Priority"
              labelClassName="text-xs uppercase tracking-[0.2em] text-[var(--muted)]"
            >
              <SelectField
                className="text-sm uppercase tracking-[0.1em]"
                value={task.priority}
                onChange={(event) => {
                  if (!canEdit) return;
                  onUpdate(task.id, {
                    priority: event.target.value as Task["priority"],
                  });
                }}
                disabled={!canEdit}
              >
                {taskPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </SelectField>
            </FormField>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <FormField
              label="Due date"
              labelClassName="text-xs uppercase tracking-[0.2em] text-[var(--muted)]"
            >
              <InputField
                className="text-sm"
                type="date"
                value={task.dueDate || ""}
                onChange={(event) => {
                  if (!canEdit) return;
                  onUpdate(task.id, { dueDate: event.target.value });
                }}
                disabled={!canEdit}
              />
            </FormField>
            <FormField
              label="Labels"
              labelClassName="text-xs uppercase tracking-[0.2em] text-[var(--muted)]"
            >
              <SelectField
                className="text-sm"
                value={selectedLabel}
                onChange={(event) => handleLabelChange(event.target.value)}
                disabled={!canEdit}
              >
                <option value="">None</option>
                {taskLabels.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </SelectField>
            </FormField>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={task.completed}
                className="h-4 w-4 accent-[var(--accent)]"
                onChange={(event) => {
                  if (!canEdit) return;
                  onUpdate(task.id, {
                    completed: event.target.checked,
                    status: event.target.checked ? "Done" : "Backlog",
                  });
                }}
                disabled={!canEdit}
              />
              Completed
            </label>
            <span>Updated {toDateString(task.updatedAt)}</span>
          </div>
        </Panel>

        <MarkdownEditorPanel
          value={description}
          onChange={setDescription}
          onSave={handleSaveDescription}
          onAutoSave={(nextValue) => {
            if (!task || !canEdit) return;
            void onUpdate(task.id, { description: nextValue });
          }}
          canEdit={canEdit}
          saving={saving}
          resetKey={task.id}
          placeholder="Write markdown details..."
          emptyText="No details yet. Switch to edit mode."
          hint="Preview supports tables, code blocks, %%alert%%, and checklists: [] or [x] (start a line and click to toggle)."
        />

        <Panel className="p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Assignees
            </p>
            <Chip>{assignedMembers.length} assigned</Chip>
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
                    disabled={!canEdit}
                  />
                </label>
              ))
            )}
          </div>
        </Panel>
      </div>
    </aside>
  );
};
