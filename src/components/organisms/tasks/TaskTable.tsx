"use client";

import {
  Fragment,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import clsx from "clsx";
import type { Task, UserProfile } from "@/lib/types";
import { Card } from "@/components/atoms/Card";
import { Chip } from "@/components/atoms/Chip";
import { SelectField } from "@/components/atoms/SelectField";

type TaskTableProps = {
  tasks: Task[];
  members: UserProfile[];
  statusOptions: Task["status"][];
  priorityOptions: Task["priority"][];
  selectedTaskId: string | null;
  selectedTaskTitle?: string | null;
  canEdit: boolean;
  onSelect: (taskId: string) => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  headerActions?: ReactNode;
};

const getOrderValue = (task: Task) =>
  task.order ??
  task.updatedAt?.toMillis?.() ??
  task.createdAt?.toMillis?.() ??
  0;

const sortTasks = (list: Task[]) =>
  list.slice().sort((a, b) => {
    const diff = getOrderValue(b) - getOrderValue(a);
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });

const parseScene = (title: string) => {
  const trimmed = title.trim();
  const match = trimmed.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (!match) {
    return { scene: "No Scene", title: trimmed || "Untitled" };
  }
  const scene = match[1].trim() || "No Scene";
  const remainder = match[2].trim();
  return { scene, title: remainder || "Untitled" };
};

const isInteractiveTarget = (target: HTMLElement | null) =>
  Boolean(target?.closest("input, button, textarea, select, a"));

export const TaskTable = ({
  tasks,
  members,
  statusOptions,
  priorityOptions,
  selectedTaskId,
  selectedTaskTitle,
  canEdit,
  onSelect,
  onUpdate,
  headerActions,
}: TaskTableProps) => {
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<
    "before" | "after" | null
  >(null);
  const draggingRef = useRef(false);

  const sceneInfoById = useMemo(() => {
    const map = new Map<string, { scene: string; title: string }>();
    tasks.forEach((task) => {
      map.set(task.id, parseScene(task.title));
    });
    return map;
  }, [tasks]);

  const sceneGroups = useMemo(() => {
    const map = new Map<string, Task[]>();
    const order: string[] = [];
    tasks.forEach((task) => {
      const scene = sceneInfoById.get(task.id)?.scene ?? "No Scene";
      if (!map.has(scene)) {
        map.set(scene, []);
        order.push(scene);
      }
      map.get(scene)?.push(task);
    });
    return order.map((scene) => ({
      scene,
      tasks: sortTasks(map.get(scene) ?? []),
    }));
  }, [sceneInfoById, tasks]);

  const memberOptions = useMemo(() => {
    return members
      .map((member) => ({
        id: member.uid,
        name:
          member.nickname ||
          member.displayName ||
          member.email ||
          "User",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members]);

  const sceneTasksMap = useMemo(() => {
    const map = new Map<string, Task[]>();
    sceneGroups.forEach((group) => {
      map.set(group.scene, group.tasks);
    });
    return map;
  }, [sceneGroups]);

  const isTaskDrag = (event: DragEvent<HTMLElement>) =>
    Boolean(
      event.dataTransfer?.types?.includes("application/x-ttm-task") ||
        event.dataTransfer?.types?.includes("text/plain")
    );

  const getDraggedTaskId = (event: DragEvent<HTMLElement>) => {
    const raw =
      event.dataTransfer?.getData("application/x-ttm-task") ||
      event.dataTransfer?.getData("text/plain");
    if (!raw) return null;
    let taskId = raw;
    try {
      const parsed = JSON.parse(raw) as { id?: string };
      if (parsed?.id) {
        taskId = parsed.id;
      }
    } catch {
      // Ignore non-JSON payloads.
    }
    return taskId;
  };

  const resolveDropPosition = (
    event: DragEvent<HTMLTableRowElement>
  ): "before" | "after" => {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientY < rect.top + rect.height / 2 ? "before" : "after";
  };

  const canDropOnTarget = (draggedId: string | null, targetId: string) => {
    if (!draggedId) return false;
    const targetScene = sceneInfoById.get(targetId)?.scene;
    const draggedScene = sceneInfoById.get(draggedId)?.scene;
    return Boolean(targetScene && draggedScene && targetScene === draggedScene);
  };

  const handleRowDragOver =
    (task: Task) => (event: DragEvent<HTMLTableRowElement>) => {
      if (!canEdit || !isTaskDrag(event)) return;
      const draggedId = getDraggedTaskId(event);
      if (draggedId && !canDropOnTarget(draggedId, task.id)) {
        setDragOverTaskId(null);
        setDragOverPosition(null);
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const position = resolveDropPosition(event);
      setDragOverTaskId(task.id);
      setDragOverPosition(position);
    };

  const handleRowDragLeave =
    (taskId: string) => (event: DragEvent<HTMLTableRowElement>) => {
      if (!canEdit) return;
      event.stopPropagation();
      const relatedTarget = event.relatedTarget as Node | null;
      if (relatedTarget && event.currentTarget.contains(relatedTarget)) {
        return;
      }
      if (dragOverTaskId === taskId) {
        setDragOverTaskId(null);
        setDragOverPosition(null);
      }
    };

  const handleRowDrop =
    (targetTask: Task) => async (event: DragEvent<HTMLTableRowElement>) => {
      if (!canEdit || !isTaskDrag(event)) return;
      event.preventDefault();
      event.stopPropagation();
      setDragOverTaskId(null);
      setDragOverPosition(null);

      const draggedTaskId = getDraggedTaskId(event);
      if (!draggedTaskId) return;
      if (draggedTaskId === targetTask.id) return;
      const draggedTask = tasks.find((item) => item.id === draggedTaskId);
      if (!draggedTask) return;

      const targetScene = sceneInfoById.get(targetTask.id)?.scene;
      const draggedScene = sceneInfoById.get(draggedTask.id)?.scene;
      if (!targetScene || !draggedScene || targetScene !== draggedScene) return;

      const list = sceneTasksMap.get(targetScene) ?? [];
      const listWithoutDragged = list.filter(
        (item) => item.id !== draggedTaskId
      );
      const targetIndex = listWithoutDragged.findIndex(
        (item) => item.id === targetTask.id
      );
      if (targetIndex === -1) return;

      const position = resolveDropPosition(event);
      const insertIndex = position === "before" ? targetIndex : targetIndex + 1;
      const prevTask = listWithoutDragged[insertIndex - 1];
      const nextTask = listWithoutDragged[insertIndex];
      const prevOrder = prevTask ? getOrderValue(prevTask) : undefined;
      const nextOrder = nextTask ? getOrderValue(nextTask) : undefined;

      let newOrder = Date.now();
      if (prevOrder !== undefined && nextOrder !== undefined) {
        if (prevOrder === nextOrder) {
          newOrder = prevOrder + 1;
        } else {
          newOrder = (prevOrder + nextOrder) / 2;
        }
      } else if (prevOrder !== undefined) {
        newOrder = prevOrder - 1;
      } else if (nextOrder !== undefined) {
        newOrder = nextOrder + 1;
      }

      try {
        await onUpdate(draggedTask.id, { order: newOrder });
      } catch {
        // Ignore drop update errors.
      }
    };

  const cellBase =
    "px-3 py-2 align-middle border-r border-[var(--border)] last:border-r-0";

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted)]">
        <div className="flex flex-wrap items-center gap-3">
          <span>{tasks.length} tasks matched</span>
          {selectedTaskTitle ? (
            <Chip>Editing: {selectedTaskTitle}</Chip>
          ) : (
            <span>Click a task to open details.</span>
          )}
        </div>
        {headerActions && <div className="flex items-center">{headerActions}</div>}
      </div>

      <Card className="overflow-hidden">
        {tasks.length === 0 ? (
          <div className="p-6 text-sm text-[var(--muted)]">
            No tasks here yet. Create one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead className="bg-[var(--surface-3)] text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                <tr>
                  <th className={clsx(cellBase, "w-16 font-semibold")}>Move</th>
                  <th className={clsx(cellBase, "font-semibold")}>Title</th>
                  <th className={clsx(cellBase, "w-40 font-semibold")}>
                    Priority
                  </th>
                  <th className={clsx(cellBase, "w-48 font-semibold")}>
                    Assignee
                  </th>
                  <th className={clsx(cellBase, "w-40 font-semibold")}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {sceneGroups.map((group) => (
                  <Fragment key={group.scene}>
                    <tr className="bg-[var(--table-header-bg)]">
                      <td
                        className={clsx(
                          cellBase,
                          "text-[0.95rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]"
                        )}
                        colSpan={5}
                      >
                        Scene: {group.scene} ({group.tasks.length})
                      </td>
                    </tr>
                    {group.tasks.map((task) => {
                      const sceneInfo = sceneInfoById.get(task.id);
                      const displayTitle = sceneInfo?.title ?? task.title;
                      const isSelected = selectedTaskId === task.id;
                      const dropBefore =
                        dragOverTaskId === task.id &&
                        dragOverPosition === "before";
                      const dropAfter =
                        dragOverTaskId === task.id &&
                        dragOverPosition === "after";
                      const hasMultipleAssignees = task.assigneeIds.length > 1;
                      const assigneeValue =
                        task.assigneeIds.length === 0
                          ? ""
                          : hasMultipleAssignees
                            ? "__multiple__"
                            : task.assigneeIds[0];

                      return (
                        <tr
                          key={task.id}
                          className={clsx(
                            "border-b border-[var(--border)] transition",
                            canEdit && "hover:bg-[var(--surface-hover)]",
                            isSelected && "bg-[var(--surface-selected)]",
                            dropBefore && "border-t-2 border-t-[var(--accent)]",
                            dropAfter && "border-b-2 border-b-[var(--accent)]"
                          )}
                          role="button"
                          tabIndex={0}
                          draggable={canEdit}
                          onDragStart={(event) => {
                            if (!canEdit || !event.dataTransfer) {
                              event.preventDefault();
                              return;
                            }
                            if (isInteractiveTarget(event.target as HTMLElement)) {
                              event.preventDefault();
                              return;
                            }
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
                            setDragOverTaskId(null);
                            setDragOverPosition(null);
                          }}
                          onDragOver={handleRowDragOver(task)}
                          onDragLeave={handleRowDragLeave(task.id)}
                          onDrop={handleRowDrop(task)}
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
                          aria-selected={isSelected}
                        >
                          <td className={clsx(cellBase, "text-xs text-[var(--muted)]")}>
                            <span
                              className={clsx(
                                "font-mono",
                                canEdit ? "cursor-move" : "cursor-default"
                              )}
                            >
                              ||
                            </span>
                          </td>
                          <td className={clsx(cellBase, "font-semibold text-[var(--text)]")}>
                            {displayTitle}
                          </td>
                          <td className={cellBase}>
                            <SelectField
                              value={task.priority}
                              disabled={!canEdit}
                              className="text-xs"
                              onClick={(event) => event.stopPropagation()}
                              onChange={async (event) => {
                                if (!canEdit) return;
                                await onUpdate(task.id, {
                                  priority: event.target.value as Task["priority"],
                                });
                              }}
                            >
                              {priorityOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </SelectField>
                          </td>
                          <td className={cellBase}>
                            <SelectField
                              value={assigneeValue}
                              disabled={!canEdit}
                              className="text-xs"
                              onClick={(event) => event.stopPropagation()}
                              onChange={async (event) => {
                                if (!canEdit) return;
                                const nextValue = event.target.value;
                                if (nextValue === "__multiple__") return;
                                const nextAssignees =
                                  nextValue === "" ? [] : [nextValue];
                                await onUpdate(task.id, {
                                  assigneeIds: nextAssignees,
                                });
                              }}
                            >
                              <option value="">Unassigned</option>
                              {hasMultipleAssignees && (
                                <option value="__multiple__" disabled>
                                  Multiple assignees
                                </option>
                              )}
                              {memberOptions.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.name}
                                </option>
                              ))}
                            </SelectField>
                          </td>
                          <td className={cellBase}>
                            <SelectField
                              value={task.status}
                              disabled={!canEdit}
                              className="text-xs"
                              onClick={(event) => event.stopPropagation()}
                              onChange={async (event) => {
                                if (!canEdit) return;
                                const nextStatus = event.target
                                  .value as Task["status"];
                                await onUpdate(task.id, {
                                  status: nextStatus,
                                  completed: nextStatus === "Done",
                                });
                              }}
                            >
                              {statusOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </SelectField>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
};
