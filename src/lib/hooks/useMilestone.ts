"use client";

import { useEffect, useState } from "react";
import type { Milestone } from "@/lib/types";
import { MilestoneService } from "@/lib/services/MilestoneService";

export const useMilestone = (
  projectId?: string | null,
  milestoneId?: string | null
) => {
  const [milestone, setMilestone] = useState<Milestone | null>(null);

  useEffect(() => {
    if (!projectId || !milestoneId) {
      setMilestone(null);
      return;
    }
    const unsubscribe = MilestoneService.subscribeMilestone(
      projectId,
      milestoneId,
      setMilestone
    );
    return () => unsubscribe();
  }, [projectId, milestoneId]);

  return milestone;
};
