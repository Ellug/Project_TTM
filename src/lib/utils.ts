import type { Timestamp } from "firebase/firestore";

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
