"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import clsx from "clsx";
import { AuthGate } from "@/components/organisms/AuthGate";
import { ScrumCalendar } from "@/components/organisms/scrums/ScrumCalendar";
import { ScrumBoard } from "@/components/organisms/scrums/ScrumBoard";
import { TaskDetailsPanel } from "@/components/organisms/tasks/TaskDetailsPanel";
import { ButtonLink } from "@/components/atoms/ButtonLink";
import { Card } from "@/components/atoms/Card";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProject } from "@/lib/hooks/useProject";
import { useMilestones } from "@/lib/hooks/useMilestones";
import { useMembers } from "@/lib/hooks/useMembers";
import { useScrums } from "@/lib/hooks/useScrums";
import { canEditProjectContent, resolveMemberRole } from "@/lib/permissions";
import { TaskService } from "@/lib/services/TaskService";
import { DiscordService } from "@/lib/services/DiscordService";
import type { Task } from "@/lib/types";

const padNumber = (value: number) => value.toString().padStart(2, "0");

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1);
  const day = padNumber(date.getDate());
  return `${year}-${month}-${day}`;
};

export default function ScrumPage() {
  const params = useParams();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;
  const { user, profile } = useAuth();

  const project = useProject(projectId);
  const milestones = useMilestones(projectId);
  const members = useMembers(project?.memberIds);
  const scrums = useScrums(projectId);

  const currentRole = resolveMemberRole(project, user?.uid);
  const canEditTasks = canEditProjectContent(currentRole);
  const userName = profile?.nickname || profile?.displayName || "Unknown";

  const [selectedDate, setSelectedDate] = useState<string | null>(() =>
    formatDateKey(new Date())
  );

  // Task details panel state
  const [selectedTaskInfo, setSelectedTaskInfo] = useState<{
    milestoneId: string;
    taskId: string;
  } | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const currentUserName = profile?.nickname || profile?.displayName || "Unknown";
  const currentUserPhotoURL = profile?.photoURL;

  // Load selected task data
  useEffect(() => {
    if (!selectedTaskInfo || !projectId) {
      setSelectedTask(null);
      return;
    }

    const loadTask = async () => {
      try {
        const snapshot = await TaskService.fetchTask(
          projectId,
          selectedTaskInfo.milestoneId,
          selectedTaskInfo.taskId
        );
        if (snapshot.exists()) {
          setSelectedTask({
            id: snapshot.id,
            ...(snapshot.data() as Omit<Task, "id">),
          });
        } else {
          setSelectedTask(null);
          setSelectedTaskInfo(null);
        }
      } catch {
        setSelectedTask(null);
        setSelectedTaskInfo(null);
      }
    };

    loadTask();
  }, [selectedTaskInfo, projectId]);

  const handleTaskClick = (milestoneId: string, taskId: string) => {
    setSelectedTaskInfo({ milestoneId, taskId });
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!projectId || !selectedTaskInfo || !canEditTasks) return;
    await TaskService.updateTask(
      projectId,
      selectedTaskInfo.milestoneId,
      taskId,
      updates
    );
    // Update local state
    setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null));
    void DiscordService.notifyTaskUpdated(
      userName,
      selectedTask?.title || "Task",
      undefined
    );
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!projectId || !selectedTaskInfo || !canEditTasks) return;
    const taskName = selectedTask?.title || "Task";
    await TaskService.deleteTask(
      projectId,
      selectedTaskInfo.milestoneId,
      taskId
    );
    setSelectedTask(null);
    setSelectedTaskInfo(null);
    void DiscordService.notifyTaskDeleted(userName, taskName);
  };

  const handleMoveTask = async (taskId: string, toMilestoneId: string) => {
    if (!projectId || !selectedTaskInfo || !canEditTasks || !selectedTask) return;
    const { id, ...taskData } = selectedTask;
    await TaskService.moveTask(
      projectId,
      selectedTaskInfo.milestoneId,
      toMilestoneId,
      taskId,
      taskData
    );
    setSelectedTask(null);
    setSelectedTaskInfo(null);
    const targetMilestone = milestones.find((m) => m.id === toMilestoneId);
    void DiscordService.notifyTaskUpdated(
      userName,
      selectedTask.title,
      `Moved to ${targetMilestone?.title || "another milestone"}`
    );
  };

  const handleClosePanel = () => {
    setSelectedTaskInfo(null);
    setSelectedTask(null);
  };

  // Keyboard handler for closing panel
  useEffect(() => {
    if (!selectedTaskInfo) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClosePanel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTaskInfo]);

  const isPanelOpen = Boolean(selectedTask);

  return (
    <AuthGate>
      <div className={clsx("task-layout", isPanelOpen && "task-layout-open")}>
        <TaskDetailsPanel
          task={selectedTask}
          members={members}
          milestones={milestones}
          currentMilestoneId={selectedTaskInfo?.milestoneId || ""}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          onMove={handleMoveTask}
          canEdit={canEditTasks}
          onClose={handleClosePanel}
        />
        {isPanelOpen && (
          <button
            type="button"
            className="task-overlay"
            aria-label="Close task details"
            onClick={handleClosePanel}
          />
        )}
        <div className="task-content grid gap-8">
          <Card className="p-6 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                  {project?.name || "Project"}
                </p>
                <h1 className="mt-2 text-2xl font-bold text-[var(--text)]">
                  Daily Scrum
                </h1>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Track daily progress for your team members.
                </p>
              </div>
              <ButtonLink
                href={`/projects/${projectId}/milestones`}
                variant="secondary"
                className="text-xs uppercase tracking-[0.2em]"
              >
                Back to Milestones
              </ButtonLink>
            </div>
          </Card>

          <ScrumCalendar
            scrums={scrums}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          {selectedDate && (
            <ScrumBoard
              projectId={projectId || ""}
              selectedDate={selectedDate}
              scrums={scrums}
              milestones={milestones}
              members={members}
              currentUserId={user?.uid}
              currentUserName={currentUserName}
              currentUserPhotoURL={currentUserPhotoURL}
              onTaskClick={handleTaskClick}
            />
          )}
        </div>
      </div>
    </AuthGate>
  );
}
