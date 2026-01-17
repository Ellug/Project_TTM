import type { Timestamp } from "firebase/firestore";

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  nickname: string;
  photoURL: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  memberIds: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type MilestoneStatus = "Planned" | "Active" | "Complete";

export type Milestone = {
  id: string;
  title: string;
  description?: string;
  status: MilestoneStatus;
  dueDate?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type TaskStatus = "Backlog" | "In Progress" | "Review" | "Done";
export type TaskPriority = "Low" | "Medium" | "High";

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  completed: boolean;
  assigneeIds: string[];
  labels: string[];
  dueDate?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  creatorId: string;
};
