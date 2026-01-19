"use client";

import { useState, useMemo, useEffect } from "react";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Panel } from "@/components/atoms/Panel";
import { ScrumItemInput } from "./ScrumItemInput";
import type { Milestone, Scrum, ScrumEntry, Task, UserProfile } from "@/lib/types";
import { ScrumService } from "@/lib/services/ScrumService";
import { MilestoneService } from "@/lib/services/MilestoneService";

type ScrumBoardProps = {
  projectId: string;
  selectedDate: string;
  scrums: Scrum[];
  milestones: Milestone[];
  members: UserProfile[];
  currentUserId?: string;
  currentUserName?: string;
  currentUserPhotoURL?: string;
  onTaskClick?: (milestoneId: string, taskId: string) => void;
};

const generateId = () => Math.random().toString(36).substring(2, 11);

type AddMode = "text" | "task";

type TaskOption = Task & {
  assigneeLabel: string;
  assigneeSortName: string;
};

const progressSortOrder: Task["status"][] = [
  "Backlog",
  "In Progress",
  "Review",
  "Done",
];

const resolveMemberName = (member?: UserProfile) =>
  member?.nickname || member?.displayName || member?.email || "User";

const getAssigneeNames = (
  task: Task,
  membersById: Map<string, UserProfile>
) =>
  task.assigneeIds
    .map((assigneeId) => resolveMemberName(membersById.get(assigneeId)))
    .sort((a, b) => a.localeCompare(b));

const formatAssigneeLabel = (assigneeNames: string[]) => {
  if (assigneeNames.length === 0) return "Unassigned";
  if (assigneeNames.length === 1) return assigneeNames[0];
  return `${assigneeNames[0]} +${assigneeNames.length - 1}`;
};

const getAssigneeRank = (task: Task, currentUserId?: string) => {
  if (task.assigneeIds.length === 0) return 0;
  if (currentUserId && task.assigneeIds.includes(currentUserId)) return 1;
  return 2;
};

const getProgressRank = (status: Task["status"]) => {
  const index = progressSortOrder.indexOf(status);
  return index === -1 ? progressSortOrder.length : index;
};

const sortTasksForScrum = (
  tasks: Task[],
  membersById: Map<string, UserProfile>,
  currentUserId?: string
): TaskOption[] =>
  tasks
    .map((task) => {
      const assigneeNames = getAssigneeNames(task, membersById);
      return {
        ...task,
        assigneeLabel: formatAssigneeLabel(assigneeNames),
        assigneeSortName: assigneeNames[0] ?? "Unassigned",
      };
    })
    .sort((a, b) => {
      const progressDiff = getProgressRank(a.status) - getProgressRank(b.status);
      if (progressDiff !== 0) return progressDiff;

      const assigneeDiff =
        getAssigneeRank(a, currentUserId) - getAssigneeRank(b, currentUserId);
      if (assigneeDiff !== 0) return assigneeDiff;

      const nameDiff = a.assigneeSortName.localeCompare(b.assigneeSortName);
      if (nameDiff !== 0) return nameDiff;

      return a.title.localeCompare(b.title);
    });

export const ScrumBoard = ({
  projectId,
  selectedDate,
  scrums,
  milestones,
  members,
  currentUserId,
  currentUserName,
  currentUserPhotoURL,
  onTaskClick,
}: ScrumBoardProps) => {
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  const [addModes, setAddModes] = useState<Record<string, AddMode>>({});
  const [selectedMilestones, setSelectedMilestones] = useState<Record<string, string>>({});
  const [selectedTasks, setSelectedTasks] = useState<Record<string, string>>({});
  const [tasksByMilestone, setTasksByMilestone] = useState<Record<string, Task[]>>({});
  const [loadingTasks, setLoadingTasks] = useState<Record<string, boolean>>({});

  const membersById = useMemo(() => {
    return new Map(members.map((member) => [member.uid, member]));
  }, [members]);

  const scrumsByUser = useMemo(() => {
    const map = new Map<string, Scrum>();
    scrums
      .filter((s) => s.date === selectedDate)
      .forEach((scrum) => {
        map.set(scrum.userId, scrum);
      });
    return map;
  }, [scrums, selectedDate]);

  // Load tasks when milestone is selected
  useEffect(() => {
    const loadTasks = async (milestoneId: string) => {
      if (tasksByMilestone[milestoneId] || loadingTasks[milestoneId]) return;

      setLoadingTasks((prev) => ({ ...prev, [milestoneId]: true }));
      try {
        const snapshot = await MilestoneService.fetchMilestoneTasks(projectId, milestoneId);
        const tasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Task, "id">),
        }));
        setTasksByMilestone((prev) => ({ ...prev, [milestoneId]: tasks }));
      } finally {
        setLoadingTasks((prev) => ({ ...prev, [milestoneId]: false }));
      }
    };

    Object.values(selectedMilestones).forEach((milestoneId) => {
      if (milestoneId) {
        loadTasks(milestoneId);
      }
    });
  }, [selectedMilestones, projectId, tasksByMilestone, loadingTasks]);

  const handleAddTextItem = async (userId: string) => {
    const text = newItemTexts[userId]?.trim();
    if (!text || !currentUserId || userId !== currentUserId) return;

    const existingScrum = scrumsByUser.get(userId);
    const newEntry: ScrumEntry = {
      id: generateId(),
      type: "text",
      content: text,
      checked: false,
    };

    if (existingScrum) {
      await ScrumService.updateScrumItems(projectId, existingScrum.id, [
        ...existingScrum.items,
        newEntry,
      ]);
    } else {
      await ScrumService.createScrum(projectId, {
        date: selectedDate,
        userId: currentUserId,
        userName: currentUserName,
        userPhotoURL: currentUserPhotoURL,
        items: [newEntry],
      });
    }

    setNewItemTexts((prev) => ({ ...prev, [userId]: "" }));
  };

  const handleAddTaskItem = async (userId: string) => {
    const milestoneId = selectedMilestones[userId];
    const taskId = selectedTasks[userId];
    if (!milestoneId || !taskId || !currentUserId || userId !== currentUserId) return;

    const tasks = tasksByMilestone[milestoneId] || [];
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const existingScrum = scrumsByUser.get(userId);
    const newEntry: ScrumEntry = {
      id: generateId(),
      type: "task",
      content: task.title,
      checked: task.completed,
      milestoneId,
      taskId,
      taskTitle: task.title,
    };

    if (existingScrum) {
      await ScrumService.updateScrumItems(projectId, existingScrum.id, [
        ...existingScrum.items,
        newEntry,
      ]);
    } else {
      await ScrumService.createScrum(projectId, {
        date: selectedDate,
        userId: currentUserId,
        userName: currentUserName,
        userPhotoURL: currentUserPhotoURL,
        items: [newEntry],
      });
    }

    // Reset selection
    setSelectedMilestones((prev) => ({ ...prev, [userId]: "" }));
    setSelectedTasks((prev) => ({ ...prev, [userId]: "" }));
    setAddModes((prev) => ({ ...prev, [userId]: "text" }));
  };

  const handleToggleItem = async (userId: string, itemId: string, checked: boolean) => {
    const scrum = scrumsByUser.get(userId);
    if (!scrum || userId !== currentUserId) return;

    const updatedItems = scrum.items.map((item) =>
      item.id === itemId ? { ...item, checked } : item
    );
    await ScrumService.updateScrumItems(projectId, scrum.id, updatedItems);
  };

  const handleUpdateItem = async (userId: string, itemId: string, content: string) => {
    const scrum = scrumsByUser.get(userId);
    if (!scrum || userId !== currentUserId) return;

    const updatedItems = scrum.items.map((item) =>
      item.id === itemId ? { ...item, content } : item
    );
    await ScrumService.updateScrumItems(projectId, scrum.id, updatedItems);
  };

  const handleDeleteItem = async (userId: string, itemId: string) => {
    const scrum = scrumsByUser.get(userId);
    if (!scrum || userId !== currentUserId) return;

    const updatedItems = scrum.items.filter((item) => item.id !== itemId);
    if (updatedItems.length === 0) {
      await ScrumService.deleteScrum(projectId, scrum.id);
    } else {
      await ScrumService.updateScrumItems(projectId, scrum.id, updatedItems);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, userId: string) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddTextItem(userId);
    }
  };

  const formattedDate = useMemo(() => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [selectedDate]);

  return (
    <Card className="p-6 animate-fade-in">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
          Daily scrum
        </p>
        <h3 className="mt-2 text-lg font-semibold text-[var(--text)]">
          {formattedDate}
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Track your daily tasks and check them off as you complete them.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => {
          const scrum = scrumsByUser.get(member.uid);
          const items = scrum?.items ?? [];
          const isOwn = member.uid === currentUserId;
          const addMode = addModes[member.uid] || "text";
          const selectedMilestoneId = selectedMilestones[member.uid] || "";
          const selectedTaskId = selectedTasks[member.uid] || "";
          const availableTasks = selectedMilestoneId ? tasksByMilestone[selectedMilestoneId] || [] : [];
          const sortedTasks = sortTasksForScrum(
            availableTasks,
            membersById,
            currentUserId
          );

          return (
            <Panel
              key={member.uid}
              className="grid gap-3 p-4"
            >
              <div className="flex items-center gap-3 border-b border-[var(--border)] pb-3">
                <Avatar
                  name={member.nickname || member.displayName}
                  src={member.photoURL}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text)]">
                    {member.nickname || member.displayName}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {items.length} item{items.length !== 1 ? "s" : ""}
                    {items.length > 0 && (
                      <span className="ml-1">
                        · {items.filter((i) => i.checked).length} done
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="min-h-[100px]">
                {items.length === 0 && !isOwn && (
                  <p className="text-sm text-[var(--muted)] italic">
                    No entries yet
                  </p>
                )}
                {items.map((item) => (
                  <ScrumItemInput
                    key={item.id}
                    item={item}
                    canEdit={isOwn}
                    onToggle={(id, checked) => handleToggleItem(member.uid, id, checked)}
                    onUpdate={(id, content) => handleUpdateItem(member.uid, id, content)}
                    onDelete={(id) => handleDeleteItem(member.uid, id)}
                    onTaskClick={onTaskClick}
                  />
                ))}
              </div>

              {isOwn && (
                <div className="border-t border-[var(--border)] pt-3">
                  {/* Mode selector */}
                  <div className="flex gap-1 mb-3">
                    <button
                      type="button"
                      onClick={() => setAddModes((prev) => ({ ...prev, [member.uid]: "text" }))}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                        addMode === "text"
                          ? "bg-[var(--accent)] text-[var(--bg)]"
                          : "bg-[var(--surface-3)] text-[var(--muted)] hover:text-[var(--text)]"
                      }`}
                    >
                      Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddModes((prev) => ({ ...prev, [member.uid]: "task" }))}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                        addMode === "task"
                          ? "bg-[var(--accent)] text-[var(--bg)]"
                          : "bg-[var(--surface-3)] text-[var(--muted)] hover:text-[var(--text)]"
                      }`}
                    >
                      Task
                    </button>
                  </div>

                  {addMode === "text" ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newItemTexts[member.uid] ?? ""}
                        onChange={(e) =>
                          setNewItemTexts((prev) => ({
                            ...prev,
                            [member.uid]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => handleKeyDown(e, member.uid)}
                        placeholder="Add a new item..."
                        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)]"
                      />
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => handleAddTextItem(member.uid)}
                        disabled={!newItemTexts[member.uid]?.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <select
                        value={selectedMilestoneId}
                        onChange={(e) => {
                          setSelectedMilestones((prev) => ({ ...prev, [member.uid]: e.target.value }));
                          setSelectedTasks((prev) => ({ ...prev, [member.uid]: "" }));
                        }}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                      >
                        <option value="">Select milestone...</option>
                        {milestones.map((milestone) => (
                          <option key={milestone.id} value={milestone.id}>
                            {milestone.title}
                          </option>
                        ))}
                      </select>

                      {selectedMilestoneId && (
                        <select
                          value={selectedTaskId}
                          onChange={(e) => setSelectedTasks((prev) => ({ ...prev, [member.uid]: e.target.value }))}
                          disabled={loadingTasks[selectedMilestoneId]}
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] disabled:opacity-50"
                        >
                          <option value="">
                            {loadingTasks[selectedMilestoneId] ? "Loading tasks..." : "Select task..."}
                          </option>
                          {sortedTasks.map((task) => (
                            <option key={task.id} value={task.id}>
                              [{task.status}] {task.title} - {task.assigneeLabel}
                            </option>
                          ))}
                        </select>
                      )}

                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => handleAddTaskItem(member.uid)}
                        disabled={!selectedMilestoneId || !selectedTaskId}
                        className="w-full"
                      >
                        Add Task
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Panel>
          );
        })}
      </div>
    </Card>
  );
};
