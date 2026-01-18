import type {
  MemberRole,
  MilestoneStatus,
  TaskPriority,
  TaskStatus,
} from "./types";

export const taskStatuses: TaskStatus[] = [
  "Backlog",
  "In Progress",
  "Review",
  "Done",
];

export const taskPriorities: TaskPriority[] = ["Low", "Medium", "High"];

export const taskLabels = [
  "Refactoring",
  "Fix",
  "Feature",
  "Optimization",
  "Docmetation",
] as const;

export type TaskLabel = (typeof taskLabels)[number];

export const milestoneStatuses: MilestoneStatus[] = [
  "Planned",
  "Active",
  "Complete",
];

export const memberRoles: MemberRole[] = [
  "owner",
  "admin",
  "editor",
  "viewer",
];
