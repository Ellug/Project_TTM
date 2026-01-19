import type { Timestamp } from "firebase/firestore";
import type { Task, UserProfile } from "./types";

export const toDateString = (value?: Timestamp | string) => {
  if (!value) {
    return "No date";
  }
  const date = typeof value === "string" ? new Date(value) : value.toDate();
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const getInitials = (name: string) => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const escapeCsvField = (value: string) => {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const exportTasksToCsv = (
  tasks: Task[],
  members: UserProfile[],
  filename: string
) => {
  const memberMap = new Map<string, string>();
  members.forEach((member) => {
    memberMap.set(
      member.uid,
      member.nickname || member.displayName || member.email || "User"
    );
  });

  const sortedTasks = [...tasks].sort((a, b) => {
    const orderA = a.order ?? 0;
    const orderB = b.order ?? 0;
    return orderA - orderB;
  });

  const header = ["title", "label", "description", "priority", "assignees", "completed", "status"];
  const rows = sortedTasks.map((task) => {
    const label = task.labels.length > 0 ? task.labels.join(", ") : "";
    const assignees = task.assigneeIds
      .map((id) => memberMap.get(id) ?? id)
      .join(", ");
    return [
      escapeCsvField(task.title),
      escapeCsvField(label),
      escapeCsvField(task.description),
      escapeCsvField(task.priority),
      escapeCsvField(assignees),
      task.completed ? "TRUE" : "FALSE",
      escapeCsvField(task.status),
    ].join(",");
  });

  const csvContent = [header.join(","), ...rows].join("\n");
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
