"use client";

import { getInitials } from "@/lib/utils";

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

export const Avatar = ({ name, src, size = "md" }: AvatarProps) => {
  const initials = getInitials(name);
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-2)] ${sizeMap[size]}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-semibold text-[var(--text)]">{initials}</span>
      )}
    </div>
  );
};
