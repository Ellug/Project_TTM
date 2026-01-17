import type { MilestoneStatus, TaskPriority, TaskStatus } from "./types";

export const taskStatuses: TaskStatus[] = [
  "Backlog",
  "In Progress",
  "Review",
  "Done",
];

export const taskPriorities: TaskPriority[] = ["Low", "Medium", "High"];

export const milestoneStatuses: MilestoneStatus[] = [
  "Planned",
  "Active",
  "Complete",
];
