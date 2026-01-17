"use client";

import {
  createContext,
  useEffect,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import clsx from "clsx";
import { taskPriorities, taskStatuses } from "@/lib/constants";
import type { Task, UserProfile } from "@/lib/types";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Chip } from "@/components/atoms/Chip";
import { InputField } from "@/components/atoms/InputField";
import { Panel } from "@/components/atoms/Panel";
import { SelectField } from "@/components/atoms/SelectField";
import { TextAreaField } from "@/components/atoms/TextAreaField";
import { FormField } from "@/components/molecules/FormField";
import { toDateString } from "@/lib/utils";
import { remarkDanger } from "@/lib/remark-danger";

type MarkdownPosition = {
  start?: {
    line?: number;
  };
};

type MarkdownNode = {
  position?: MarkdownPosition;
  properties?: {
    className?: string | string[];
  };
};

type MarkdownCheckboxProps = ComponentPropsWithoutRef<"input"> & {
  node?: MarkdownNode;
};

type MarkdownListItemProps = ComponentPropsWithoutRef<"li"> & {
  node?: MarkdownNode;
};

const checkboxPattern = /^(\s*)([-*+]\s+)?\[(\s|x|X)?\]\s*(.*)$/;

const parseFence = (line: string) => line.match(/^\s*([`~]{3,})/);

const TaskListLineContext = createContext<number | null>(null);

const useTaskListLineIndex = () => useContext(TaskListLineContext);

const getCheckboxStateAtLine = (value: string, lineIndex: number) => {
  const lines = value.split("\n");
  if (lineIndex < 0 || lineIndex >= lines.length) return null;
  const match = lines[lineIndex].match(checkboxPattern);
  if (!match) return null;
  const mark = match[3] ?? "";
  return mark.trim().toLowerCase() === "x";
};

const normalizeMarkdownCheckboxes = (value: string) => {
  const lines = value.split("\n");
  let inFence = false;
  let fenceChar = "";
  let fenceSize = 0;

  return lines
    .map((line) => {
      const fenceMatch = parseFence(line);
      if (fenceMatch) {
        const fence = fenceMatch[1];
        if (!inFence) {
          inFence = true;
          fenceChar = fence[0];
          fenceSize = fence.length;
        } else if (fence[0] === fenceChar && fence.length >= fenceSize) {
          inFence = false;
          fenceChar = "";
          fenceSize = 0;
        }
        return line;
      }
      if (inFence) return line;
      const match = line.match(checkboxPattern);
      if (!match) return line;
      const indent = match[1] ?? "";
      const listMarker = match[2] ?? "";
      const mark = match[3] ?? "";
      const content = match[4] ?? "";
      const checked = mark.trim().toLowerCase() === "x";
      const bracket = checked ? "[x]" : "[ ]";
      const prefix = listMarker.trim().length ? listMarker : "- ";
      return `${indent}${prefix}${bracket}${content ? ` ${content}` : ""}`;
    })
    .join("\n");
};

const findCheckboxLineIndex = (value: string, targetOrder: number) => {
  const lines = value.split("\n");
  let inFence = false;
  let fenceChar = "";
  let fenceSize = 0;
  let order = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fenceMatch = parseFence(line);
    if (fenceMatch) {
      const fence = fenceMatch[1];
      if (!inFence) {
        inFence = true;
        fenceChar = fence[0];
        fenceSize = fence.length;
      } else if (fence[0] === fenceChar && fence.length >= fenceSize) {
        inFence = false;
        fenceChar = "";
        fenceSize = 0;
      }
      continue;
    }
    if (inFence) continue;
    if (checkboxPattern.test(line)) {
      if (order === targetOrder) {
        return index;
      }
      order += 1;
    }
  }

  return undefined;
};

const toggleCheckboxLine = (
  value: string,
  lineIndex: number,
  nextChecked: boolean
) => {
  const lines = value.split("\n");
  if (lineIndex < 0 || lineIndex >= lines.length) return value;

  let inFence = false;
  let fenceChar = "";
  let fenceSize = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fenceMatch = parseFence(line);
    if (fenceMatch) {
      const fence = fenceMatch[1];
      if (!inFence) {
        inFence = true;
        fenceChar = fence[0];
        fenceSize = fence.length;
      } else if (fence[0] === fenceChar && fence.length >= fenceSize) {
        inFence = false;
        fenceChar = "";
        fenceSize = 0;
      }
    }
    if (index === lineIndex) {
      if (inFence) return value;
      const match = line.match(checkboxPattern);
      if (!match) return value;
      const indent = match[1] ?? "";
      const listMarker = match[2] ?? "";
      const content = match[4] ?? "";
      const marker = nextChecked ? "[x]" : "[ ]";
      const prefix = listMarker ? `${indent}${listMarker}` : indent;
      lines[index] = `${prefix}${marker}${content ? ` ${content}` : ""}`;
      break;
    }
  }

  return lines.join("\n");
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
  const [labelsInput, setLabelsInput] = useState(
    task?.labels.join(", ") ?? ""
  );
  const [description, setDescription] = useState(task?.description ?? "");
  const [detailsMode, setDetailsMode] = useState<"preview" | "edit">(
    "preview"
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const previousTaskId = useRef<string | null>(null);
  const descriptionRef = useRef(description);

  useEffect(() => {
    descriptionRef.current = description;
  }, [description]);

  useEffect(() => {
    if (!task) return;
    if (previousTaskId.current === task.id) return;
    previousTaskId.current = task.id;
    setTitle(task.title);
    setLabelsInput(task.labels.join(", "));
    setDescription(task.description);
    setDetailsMode("preview");
  }, [task]);

  useEffect(() => {
    if (!canEdit) {
      setDetailsMode("preview");
    }
  }, [canEdit]);

  const assignedMembers = useMemo(
    () =>
      task
        ? members.filter((member) => task.assigneeIds.includes(member.uid))
        : [],
    [members, task]
  );

  const renderedDescription = useMemo(
    () => normalizeMarkdownCheckboxes(description),
    [description]
  );
  const checkboxIndexRef = useRef(0);
  checkboxIndexRef.current = 0;

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

  const handleLabelsCommit = async () => {
    if (!task || !canEdit) return;
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
      setDetailsMode("preview");
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

  const handleToggleCheckbox = (lineIndex: number, nextChecked: boolean) => {
    if (!task || !canEdit) return;
    const nextDescription = toggleCheckboxLine(
      descriptionRef.current,
      lineIndex,
      nextChecked
    );
    if (nextDescription === descriptionRef.current) return;
    descriptionRef.current = nextDescription;
    setDescription(nextDescription);
    void onUpdate(task.id, { description: nextDescription });
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
              <InputField
                className="text-sm"
                value={labelsInput}
                onChange={(event) => setLabelsInput(event.target.value)}
                onBlur={handleLabelsCommit}
                placeholder="combat, ui, fx"
                readOnly={!canEdit}
              />
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

        <Panel className="markdown-panel p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Details
              </p>
              <Chip>Markdown</Chip>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className={clsx(
                    "text-xs uppercase tracking-[0.2em]",
                    detailsMode === "preview" && "text-[var(--text)]"
                  )}
                  onClick={() => setDetailsMode("preview")}
                >
                  Preview
                </Button>
                <Button
                  variant="ghost"
                  className={clsx(
                    "text-xs uppercase tracking-[0.2em]",
                    detailsMode === "edit" && "text-[var(--text)]"
                  )}
                  onClick={() => setDetailsMode("edit")}
                >
                  Edit
                </Button>
              </div>
            )}
          </div>
          {detailsMode === "edit" ? (
            <TextAreaField
              className="markdown-input mt-3 text-xs"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Write markdown details..."
              readOnly={!canEdit}
            />
          ) : (
            <div className="markdown mt-3 text-sm text-[var(--text)]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks, remarkDanger]}
                components={{
                  input: ({ node, ...props }: MarkdownCheckboxProps) => {
                    const lineIndexFromContext = useTaskListLineIndex();
                    if (props.type !== "checkbox") {
                      return <input {...props} />;
                    }
                    const checkboxOrder = checkboxIndexRef.current;
                    checkboxIndexRef.current += 1;
                    const lineIndexFromNode = node?.position?.start?.line
                      ? node.position.start.line - 1
                      : undefined;
                    const lineIndex =
                      lineIndexFromContext ??
                      lineIndexFromNode ??
                      findCheckboxLineIndex(description, checkboxOrder);
                    const canToggle =
                      canEdit && typeof lineIndex === "number" && lineIndex >= 0;
                    const lineChecked =
                      typeof lineIndex === "number"
                        ? getCheckboxStateAtLine(description, lineIndex)
                        : null;
                    const isChecked =
                      lineChecked ?? Boolean(props.checked);
                    return (
                      <input
                        {...props}
                        type="checkbox"
                        checked={isChecked}
                        disabled={!canToggle}
                        readOnly
                        onClick={(event) => {
                          if (!canEdit) return;
                          event.preventDefault();
                          const resolvedLineIndex =
                            typeof lineIndex === "number"
                              ? lineIndex
                              : findCheckboxLineIndex(
                                  descriptionRef.current,
                                  checkboxOrder
                                );
                          if (resolvedLineIndex === undefined) return;
                          handleToggleCheckbox(
                            resolvedLineIndex,
                            !isChecked
                          );
                        }}
                        onKeyDown={(event) => {
                          if (!canEdit) return;
                          if (event.key !== " " && event.key !== "Enter") return;
                          event.preventDefault();
                          const resolvedLineIndex =
                            typeof lineIndex === "number"
                              ? lineIndex
                              : findCheckboxLineIndex(
                                  descriptionRef.current,
                                  checkboxOrder
                                );
                          if (resolvedLineIndex === undefined) return;
                          handleToggleCheckbox(
                            resolvedLineIndex,
                            !isChecked
                          );
                        }}
                      />
                    );
                  },
                  li: ({ node, children, ...props }: MarkdownListItemProps) => {
                    const classNames = node?.properties?.className;
                    const classList = Array.isArray(classNames)
                      ? classNames
                      : typeof classNames === "string"
                        ? classNames.split(" ")
                        : [];
                    const isTaskItem = classList.includes("task-list-item");
                    if (!isTaskItem) {
                      return <li {...props}>{children}</li>;
                    }
                    const lineIndex = node?.position?.start?.line
                      ? node.position.start.line - 1
                      : null;
                    return (
                      <li {...props}>
                        <TaskListLineContext.Provider value={lineIndex}>
                          {children}
                        </TaskListLineContext.Provider>
                      </li>
                    );
                  },
                }}
              >
                {renderedDescription ||
                  "No details yet. Switch to edit mode."}
              </ReactMarkdown>
            </div>
          )}
          {detailsMode === "edit" && canEdit && (
            <div className="mt-3 flex items-center gap-3">
              <Button
                variant="primary"
                className="text-xs"
                onClick={handleSaveDescription}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save details"}
              </Button>
              <span className="text-xs text-[var(--muted)]">
                Preview supports tables, code blocks, %%alert%%, and checklists:
                [] or [x] (start a line and click to toggle).
              </span>
            </div>
          )}
        </Panel>

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
