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

export type MemberRole = "owner" | "admin" | "editor" | "viewer";

export type Project = {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  memberIds: string[];
  memberRoles?: Record<string, MemberRole>;
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
  order?: number;
  dueDate?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  creatorId: string;
};

export type CsvFormatColumns = {
  scene?: string;
  category?: string;
  feature?: string;
  detail?: string;
  logic?: string;
  progress?: string;
  result?: string;
};

export type CsvFormat = {
  id: string;
  name: string;
  hasHeader: boolean;
  columns: CsvFormatColumns;
  ownerId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
