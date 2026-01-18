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
import { useProject } from "@/lib/hooks/useProject";
import { useTasks } from "@/lib/hooks/useTasks";
import { canEditProjectContent, resolveMemberRole } from "@/lib/permissions";
import { ProjectService } from "@/lib/services/ProjectService";
import { TaskService } from "@/lib/services/TaskService";
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
  const { user } = useAuth();

  const project = useProject(projectId);
  const milestone = useMilestone(projectId, milestoneId);
  const tasks = useTasks(projectId, milestoneId);
  const members = useMembers(project?.memberIds);

  const currentRole = resolveMemberRole(project, user?.uid);
  const canEditTasks = canEditProjectContent(currentRole);
  const orderSeedRef = useRef<Set<string>>(new Set());

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
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!projectId || !milestoneId || !canEditTasks) return;
    await TaskService.updateTask(projectId, milestoneId, taskId, updates);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!projectId || !milestoneId || !canEditTasks) return;
    await TaskService.deleteTask(projectId, milestoneId, taskId);
    setSelectedTaskId(null);
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
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
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
            onDeleted={() =>
              projectId
                ? router.push(`/projects/${projectId}/milestones`)
                : router.push("/projects")
            }
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
