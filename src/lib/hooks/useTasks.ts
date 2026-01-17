"use client";

import { useEffect, useState } from "react";
import type { Task } from "@/lib/types";
import { TaskService } from "@/lib/services/TaskService";

export const useTasks = (
  projectId?: string | null,
  milestoneId?: string | null
) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!projectId || !milestoneId) {
      setTasks([]);
      return;
    }
    const unsubscribe = TaskService.subscribeTasks(
      projectId,
      milestoneId,
      setTasks
    );
    return () => unsubscribe();
  }, [projectId, milestoneId]);

  return tasks;
};
