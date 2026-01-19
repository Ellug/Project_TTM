"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import clsx from "clsx";
import { AuthGate } from "@/components/organisms/AuthGate";
import { TaskDetailsPanel } from "@/components/organisms/tasks/TaskDetailsPanel";
import { MilestoneHeader } from "@/components/organisms/milestones/MilestoneHeader";
import { TaskBoard } from "@/components/organisms/tasks/TaskBoard";
import { TaskCreateForm } from "@/components/organisms/tasks/TaskCreateForm";
import { TaskFilters } from "@/components/organisms/tasks/TaskFilters";
import { TaskTable } from "@/components/organisms/tasks/TaskTable";
import { Button } from "@/components/atoms/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { taskPriorities, taskStatuses } from "@/lib/constants";
import { useMembers } from "@/lib/hooks/useMembers";
import { useMilestone } from "@/lib/hooks/useMilestone";
import { useMilestones } from "@/lib/hooks/useMilestones";
import { useProject } from "@/lib/hooks/useProject";
import { useTasks } from "@/lib/hooks/useTasks";
import { canEditProjectContent, resolveMemberRole } from "@/lib/permissions";
import { ProjectService } from "@/lib/services/ProjectService";
import { TaskService } from "@/lib/services/TaskService";
import { DiscordService } from "@/lib/services/DiscordService";
import { exportTasksToCsv } from "@/lib/utils";
import type { Task } from "@/lib/types";

export default function MilestoneTasksPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;
  const milestoneId = Array.isArray(params.milestoneId)
    ? params.milestoneId[0]
    : params.milestoneId;
  const { user, profile } = useAuth();

  const project = useProject(projectId);
  const milestone = useMilestone(projectId, milestoneId);
  const milestones = useMilestones(projectId);
  const tasks = useTasks(projectId, milestoneId);
  const members = useMembers(project?.memberIds);

  const currentRole = resolveMemberRole(project, user?.uid);
  const canEditTasks = canEditProjectContent(currentRole);
  const orderSeedRef = useRef<Set<string>>(new Set());

  const userName = profile?.nickname || profile?.displayName || "Unknown";
  const projectName = project?.name || "Unknown Project";
  const milestoneName = milestone?.title || "Unknown Milestone";
  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((member) => {
      map.set(
        member.uid,
        member.nickname || member.displayName || member.email || "User"
      );
    });
    return map;
  }, [members]);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"board" | "table">("board");

  const handleCreateTask = async (data: {
    title: string;
    priority: Task["priority"];
    dueDate: string;
  }) => {
    if (!projectId || !milestoneId || !user || !canEditTasks) return;
    const docRef = await TaskService.createTask(projectId, milestoneId, {
      title: data.title,
      description: "",
      priority: data.priority,
      dueDate: data.dueDate,
      creatorId: user.uid,
    });
    await ProjectService.touchProject(projectId);
    setSelectedTaskId(docRef.id);
    void DiscordService.notifyTaskCreated(
      userName,
      projectName,
      milestoneName,
      data.title
    );
  };

  const resolveTaskName = (taskId: string, updates?: Partial<Task>) => {
    if (updates?.title?.trim()) return updates.title.trim();
    return tasks.find((task) => task.id === taskId)?.title || "Unknown task";
  };

  const buildTaskUpdateDetails = (updates: Partial<Task>) => {
    const detailParts: string[] = [];
    if (updates.title?.trim()) {
      detailParts.push(`Title: ${updates.title.trim()}`);
    }
    if (updates.status) detailParts.push(`Status: ${updates.status}`);
    if (updates.priority) detailParts.push(`Priority: ${updates.priority}`);
    if (updates.dueDate !== undefined) {
      detailParts.push(
        updates.dueDate ? `Due: ${updates.dueDate}` : "Due date cleared"
      );
    }
    if (updates.assigneeIds) {
      const names = updates.assigneeIds
        .map((id) => memberNameById.get(id) ?? id)
        .filter((name) => name.trim().length > 0);
      detailParts.push(
        names.length ? `Assignees: ${names.join(", ")}` : "Assignees cleared"
      );
    }
    if (updates.labels) {
      detailParts.push(
        updates.labels.length
          ? `Labels: ${updates.labels.join(", ")}`
          : "Labels cleared"
      );
    }
    if (updates.completed !== undefined) {
      detailParts.push(
        updates.completed ? "Marked complete" : "Marked incomplete"
      );
    }
    if (updates.description !== undefined) {
      detailParts.push("Description updated");
    }
    if (updates.order !== undefined) {
      detailParts.push("Order updated");
    }
    return detailParts.join(", ");
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!projectId || !milestoneId || !canEditTasks) return;
    await TaskService.updateTask(projectId, milestoneId, taskId, updates);
    const taskName = resolveTaskName(taskId, updates);
    const details = buildTaskUpdateDetails(updates);
    void DiscordService.notifyTaskUpdated(
      userName,
      taskName,
      details || undefined
    );
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!projectId || !milestoneId || !canEditTasks) return;
    const taskName = resolveTaskName(taskId);
    await TaskService.deleteTask(projectId, milestoneId, taskId);
    setSelectedTaskId(null);
    void DiscordService.notifyTaskDeleted(userName, taskName);
  };

  const handleMoveTask = async (taskId: string, toMilestoneId: string) => {
    if (!projectId || !milestoneId || !canEditTasks) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const targetMilestone = milestones.find((m) => m.id === toMilestoneId);
    const { id, ...taskData } = task;
    await TaskService.moveTask(projectId, milestoneId, toMilestoneId, taskId, taskData);
    setSelectedTaskId(null);
    void DiscordService.notifyTaskUpdated(
      userName,
      task.title,
      `Moved to ${targetMilestone?.title || "another milestone"}`
    );
  };

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) || null,
    [tasks, selectedTaskId]
  );

  useEffect(() => {
    if (!selectedTaskId) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedTaskId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTaskId]);

  useEffect(() => {
    if (!selectedTaskId) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !target.closest(".task-layout")) return;
      if (target.closest(".task-panel")) return;
      if (
        target.closest(
          ".task-card, .card, .panel, button, a, input, select, textarea, [role='button']"
        )
      ) {
        return;
      }
      setSelectedTaskId(null);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown);
  }, [selectedTaskId]);

  useEffect(() => {
    if (!projectId || !milestoneId || !canEditTasks) return;
    const missingOrderTasks = tasks.filter(
      (task) =>
        (task.order === undefined ||
          task.order === null ||
          Number.isNaN(task.order)) &&
        !orderSeedRef.current.has(task.id)
    );
    if (!missingOrderTasks.length) return;
    missingOrderTasks.forEach((task, index) => {
      orderSeedRef.current.add(task.id);
      const fallbackOrder =
        task.updatedAt?.toMillis?.() ??
        task.createdAt?.toMillis?.() ??
        Date.now() + index;
      TaskService.updateTask(projectId, milestoneId, task.id, {
        order: fallbackOrder,
      })
        .catch(() => {})
        .finally(() => {
          orderSeedRef.current.delete(task.id);
        });
    });
  }, [projectId, milestoneId, canEditTasks, tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = [task.title, task.description]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "All" || task.priority === priorityFilter;
      const matchesAssignee =
        assigneeFilter === "All" || task.assigneeIds.includes(assigneeFilter);
      return (
        matchesSearch && matchesStatus && matchesPriority && matchesAssignee
      );
    });
  }, [tasks, search, statusFilter, priorityFilter, assigneeFilter]);

  const isPanelOpen = Boolean(selectedTask);
  const viewToggleLabel = viewMode === "board" ? "Excel view" : "Board view";
  const viewToggle = (
    <Button
      variant="secondary"
      className="text-xs uppercase tracking-[0.2em]"
      onClick={() =>
        setViewMode((prev) => (prev === "board" ? "table" : "board"))
      }
    >
      {viewToggleLabel}
    </Button>
  );

  return (
    <AuthGate>
      <div className={clsx("task-layout", isPanelOpen && "task-layout-open")}>
        <TaskDetailsPanel
          task={selectedTask}
          members={members}
          milestones={milestones}
          currentMilestoneId={milestoneId || ""}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          onMove={handleMoveTask}
          canEdit={canEditTasks}
          onClose={() => setSelectedTaskId(null)}
        />
        {isPanelOpen && (
          <button
            type="button"
            className="task-overlay"
            aria-label="Close task details"
            onClick={() => setSelectedTaskId(null)}
          />
        )}
        <div className="task-content grid gap-8">
          <MilestoneHeader
            projectId={projectId || ""}
            milestone={milestone}
            canEdit={canEditTasks}
            onUpdated={(updates) => {
              void DiscordService.notifyMilestoneUpdated(
                userName,
                projectName,
                updates.title
              );
            }}
            onDeleted={() => {
              void DiscordService.notifyMilestoneDeleted(
                userName,
                projectName,
                milestoneName
              );
              if (projectId) {
                router.push(`/projects/${projectId}/milestones`);
              } else {
                router.push("/projects");
              }
            }}
            onExportCsv={() => {
              const filename = milestone?.title || "tasks";
              exportTasksToCsv(tasks, members, filename);
            }}
          />

          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <TaskCreateForm
              onCreate={handleCreateTask}
              priorityOptions={taskPriorities}
              disabled={!canEditTasks}
            />
            <TaskFilters
              search={search}
              statusFilter={statusFilter}
              priorityFilter={priorityFilter}
              assigneeFilter={assigneeFilter}
              members={members}
              statusOptions={taskStatuses}
              priorityOptions={taskPriorities}
              onSearchChange={setSearch}
              onStatusChange={setStatusFilter}
              onPriorityChange={setPriorityFilter}
              onAssigneeChange={setAssigneeFilter}
              onClear={() => {
                setSearch("");
                setStatusFilter("All");
                setPriorityFilter("All");
                setAssigneeFilter("All");
              }}
            />
          </section>

          {viewMode === "table" ? (
            <TaskTable
              tasks={filteredTasks}
              members={members}
              statusOptions={taskStatuses}
              priorityOptions={taskPriorities}
              selectedTaskId={selectedTaskId}
              selectedTaskTitle={selectedTask?.title}
              canEdit={canEditTasks}
              onSelect={(taskId) =>
                setSelectedTaskId((prev) => (prev === taskId ? null : taskId))
              }
              onUpdate={handleUpdateTask}
              headerActions={viewToggle}
            />
          ) : (
            <TaskBoard
              tasks={filteredTasks}
              members={members}
              statusOptions={taskStatuses}
              selectedTaskId={selectedTaskId}
              selectedTaskTitle={selectedTask?.title}
              canEdit={canEditTasks}
              onSelect={(taskId) =>
                setSelectedTaskId((prev) => (prev === taskId ? null : taskId))
              }
              onUpdate={handleUpdateTask}
              headerActions={viewToggle}
            />
          )}
        </div>
      </div>
    </AuthGate>
  );
}
