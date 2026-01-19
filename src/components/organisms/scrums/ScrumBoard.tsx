"use client";

import { useState, useMemo } from "react";
import { Avatar } from "@/components/atoms/Avatar";
import { Card } from "@/components/atoms/Card";
import { Panel } from "@/components/atoms/Panel";
import { ScrumItemInput } from "./ScrumItemInput";
import type { Scrum, ScrumEntry, UserProfile } from "@/lib/types";
import { ScrumService } from "@/lib/services/ScrumService";

type ScrumBoardProps = {
  projectId: string;
  selectedDate: string;
  scrums: Scrum[];
  members: UserProfile[];
  currentUserId?: string;
  currentUserName?: string;
  currentUserPhotoURL?: string;
};

const generateId = () => Math.random().toString(36).substring(2, 11);

export const ScrumBoard = ({
  projectId,
  selectedDate,
  scrums,
  members,
  currentUserId,
  currentUserName,
  currentUserPhotoURL,
}: ScrumBoardProps) => {
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});

  const scrumsByUser = useMemo(() => {
    const map = new Map<string, Scrum>();
    scrums
      .filter((s) => s.date === selectedDate)
      .forEach((scrum) => {
        map.set(scrum.userId, scrum);
      });
    return map;
  }, [scrums, selectedDate]);

  const handleAddItem = async (userId: string) => {
    const text = newItemTexts[userId]?.trim();
    if (!text || !currentUserId || userId !== currentUserId) return;

    const existingScrum = scrumsByUser.get(userId);
    const newEntry: ScrumEntry = {
      id: generateId(),
      content: text,
      checked: false,
    };

    if (existingScrum) {
      await ScrumService.updateScrumItems(projectId, existingScrum.id, [
        ...existingScrum.items,
        newEntry,
      ]);
    } else {
      await ScrumService.createScrum(projectId, {
        date: selectedDate,
        userId: currentUserId,
        userName: currentUserName,
        userPhotoURL: currentUserPhotoURL,
        items: [newEntry],
      });
    }

    setNewItemTexts((prev) => ({ ...prev, [userId]: "" }));
  };

  const handleToggleItem = async (userId: string, itemId: string, checked: boolean) => {
    const scrum = scrumsByUser.get(userId);
    if (!scrum || userId !== currentUserId) return;

    const updatedItems = scrum.items.map((item) =>
      item.id === itemId ? { ...item, checked } : item
    );
    await ScrumService.updateScrumItems(projectId, scrum.id, updatedItems);
  };

  const handleUpdateItem = async (userId: string, itemId: string, content: string) => {
    const scrum = scrumsByUser.get(userId);
    if (!scrum || userId !== currentUserId) return;

    const updatedItems = scrum.items.map((item) =>
      item.id === itemId ? { ...item, content } : item
    );
    await ScrumService.updateScrumItems(projectId, scrum.id, updatedItems);
  };

  const handleDeleteItem = async (userId: string, itemId: string) => {
    const scrum = scrumsByUser.get(userId);
    if (!scrum || userId !== currentUserId) return;

    const updatedItems = scrum.items.filter((item) => item.id !== itemId);
    if (updatedItems.length === 0) {
      await ScrumService.deleteScrum(projectId, scrum.id);
    } else {
      await ScrumService.updateScrumItems(projectId, scrum.id, updatedItems);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, userId: string) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddItem(userId);
    }
  };

  const formattedDate = useMemo(() => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [selectedDate]);

  return (
    <Card className="p-6 animate-fade-in">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
          Daily scrum
        </p>
        <h3 className="mt-2 text-lg font-semibold text-[var(--text)]">
          {formattedDate}
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Track your daily tasks and check them off as you complete them.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => {
          const scrum = scrumsByUser.get(member.uid);
          const items = scrum?.items ?? [];
          const isOwn = member.uid === currentUserId;

          return (
            <Panel
              key={member.uid}
              className="grid gap-3 p-4"
            >
              <div className="flex items-center gap-3 border-b border-[var(--border)] pb-3">
                <Avatar
                  name={member.nickname || member.displayName}
                  src={member.photoURL}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text)]">
                    {member.nickname || member.displayName}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {items.length} item{items.length !== 1 ? "s" : ""}
                    {items.length > 0 && (
                      <span className="ml-1">
                        · {items.filter((i) => i.checked).length} done
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="min-h-[100px]">
                {items.length === 0 && !isOwn && (
                  <p className="text-sm text-[var(--muted)] italic">
                    No entries yet
                  </p>
                )}
                {items.map((item) => (
                  <ScrumItemInput
                    key={item.id}
                    item={item}
                    canEdit={isOwn}
                    onToggle={(id, checked) => handleToggleItem(member.uid, id, checked)}
                    onUpdate={(id, content) => handleUpdateItem(member.uid, id, content)}
                    onDelete={(id) => handleDeleteItem(member.uid, id)}
                  />
                ))}
              </div>

              {isOwn && (
                <div className="flex gap-2 border-t border-[var(--border)] pt-3">
                  <input
                    type="text"
                    value={newItemTexts[member.uid] ?? ""}
                    onChange={(e) =>
                      setNewItemTexts((prev) => ({
                        ...prev,
                        [member.uid]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => handleKeyDown(e, member.uid)}
                    placeholder="Add a new item..."
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItem(member.uid)}
                    disabled={!newItemTexts[member.uid]?.trim()}
                    className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--bg)] transition hover:opacity-90 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              )}
            </Panel>
          );
        })}
      </div>
    </Card>
  );
};
