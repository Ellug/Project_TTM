"use client";

import { useState } from "react";
import clsx from "clsx";
import type { ScrumEntry } from "@/lib/types";

type ScrumItemInputProps = {
  item: ScrumEntry;
  canEdit: boolean;
  onToggle: (id: string, checked: boolean) => void;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
};

export const ScrumItemInput = ({
  item,
  canEdit,
  onToggle,
  onUpdate,
  onDelete,
}: ScrumItemInputProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.content);

  const handleToggle = () => {
    if (!canEdit) return;
    onToggle(item.id, !item.checked);
  };

  const handleStartEdit = () => {
    if (!canEdit) return;
    setIsEditing(true);
    setEditValue(item.content);
  };

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== item.content) {
      onUpdate(item.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSave();
    } else if (event.key === "Escape") {
      setIsEditing(false);
      setEditValue(item.content);
    }
  };

  return (
    <div className="group flex items-start gap-2 rounded-lg p-2 transition hover:bg-[var(--surface-3)]">
      <button
        type="button"
        onClick={handleToggle}
        disabled={!canEdit}
        className={clsx(
          "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition",
          item.checked
            ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]"
            : "border-[var(--border)] bg-[var(--surface)]",
          canEdit && "cursor-pointer hover:border-[var(--accent)]"
        )}
        aria-label={item.checked ? "Mark as incomplete" : "Mark as complete"}
      >
        {item.checked && (
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>

      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
          autoFocus
        />
      ) : (
        <span
          className={clsx(
            "flex-1 text-sm leading-relaxed",
            item.checked
              ? "text-[var(--muted)] line-through"
              : "text-[var(--text)]",
            canEdit && "cursor-pointer"
          )}
          onClick={handleStartEdit}
        >
          {item.content}
        </span>
      )}

      {canEdit && !isEditing && (
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="flex-shrink-0 rounded p-1 text-[var(--muted)] opacity-0 transition hover:bg-[var(--danger)] hover:text-white group-hover:opacity-100"
          aria-label="Delete item"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
