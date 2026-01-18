"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import type { Milestone } from "@/lib/types";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";

type MilestoneCalendarProps = {
  projectId: string;
  milestones: Milestone[];
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const padNumber = (value: number) => value.toString().padStart(2, "0");

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1);
  const day = padNumber(date.getDate());
  return `${year}-${month}-${day}`;
};

const parseDateValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const [year, month, day] = trimmed.slice(0, 10).split("-").map(Number);
  if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const getDateKeyFromValue = (value: string) => {
  const parsed = parseDateValue(value);
  if (!parsed) return null;
  return formatDateKey(parsed);
};

export const MilestoneCalendar = ({
  projectId,
  milestones,
}: MilestoneCalendarProps) => {
  const router = useRouter();
  const [activeMonth, setActiveMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const milestonesByDate = useMemo(() => {
    const map = new Map<string, Milestone[]>();
    milestones.forEach((milestone) => {
      if (!milestone.dueDate) return;
      const key = getDateKeyFromValue(milestone.dueDate);
      if (!key) return;
      const list = map.get(key);
      if (list) {
        list.push(milestone);
      } else {
        map.set(key, [milestone]);
      }
    });
    map.forEach((items) => {
      items.sort((a, b) => a.title.localeCompare(b.title));
    });
    return map;
  }, [milestones]);

  const calendarDays = useMemo(() => {
    const year = activeMonth.getFullYear();
    const month = activeMonth.getMonth();
    const monthStart = new Date(year, month, 1);
    const startOffset = monthStart.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return {
        date,
        dateKey: formatDateKey(date),
        isCurrentMonth: date.getMonth() === month,
      };
    });
  }, [activeMonth]);

  const monthLabel = useMemo(
    () =>
      activeMonth.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    [activeMonth]
  );

  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  const handlePrevMonth = () => {
    setActiveMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setActiveMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const goToMilestone = (milestoneId: string) => {
    if (!projectId) return;
    router.push(`/projects/${projectId}/milestones/${milestoneId}`);
  };

  return (
    <Card className="p-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
            Milestone calendar
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[var(--text)]">
            Track due dates across the month
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Hover a highlighted day to see what is due, then click a milestone to
            open it.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="text-xs uppercase tracking-[0.2em]"
            onClick={handlePrevMonth}
            aria-label="Previous month"
          >
            Prev
          </Button>
          <div className="min-w-[160px] text-center text-sm font-semibold text-[var(--text)]">
            {monthLabel}
          </div>
          <Button
            type="button"
            variant="ghost"
            className="text-xs uppercase tracking-[0.2em]"
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            Next
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
        {weekdayLabels.map((label) => (
          <div key={label} className="text-center">
            {label}
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2">
        {calendarDays.map((day) => {
          const milestonesForDay = milestonesByDate.get(day.dateKey) ?? [];
          const isToday = day.dateKey === todayKey;
          const hasMilestones = milestonesForDay.length > 0;
          const dayLabel = day.date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          const ariaLabel = hasMilestones
            ? `${dayLabel}. ${milestonesForDay.length} milestone${
                milestonesForDay.length > 1 ? "s" : ""
              } due: ${milestonesForDay.map((item) => item.title).join(", ")}`
            : dayLabel;

          return (
            <div key={day.dateKey} className="group relative">
              <button
                type="button"
                className={clsx(
                  "relative flex h-14 w-full flex-col items-end justify-between rounded-xl border px-2 py-1 text-xs transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-2)]",
                  day.isCurrentMonth
                    ? "text-[var(--text)]"
                    : "text-[var(--muted)] opacity-60",
                  hasMilestones
                    ? "border-[rgba(110,231,255,0.45)] bg-[rgba(110,231,255,0.12)] shadow-[inset_0_0_0_1px_rgba(110,231,255,0.12)]"
                    : "border-[var(--border)] bg-[var(--surface-3)]",
                  hasMilestones ? "cursor-pointer" : "cursor-default",
                  isToday && "ring-1 ring-[rgba(110,231,255,0.5)]"
                )}
                onClick={() => {
                  if (!hasMilestones) return;
                  goToMilestone(milestonesForDay[0].id);
                }}
                aria-label={ariaLabel}
                aria-disabled={!hasMilestones}
              >
                <span className="text-sm font-semibold">{day.date.getDate()}</span>
                {hasMilestones && (
                  <span className="self-start rounded-full bg-[var(--accent)] px-2 py-[2px] text-[0.6rem] font-semibold uppercase text-[var(--bg)]">
                    {milestonesForDay.length} due
                  </span>
                )}
              </button>

              {hasMilestones && (
                <div className="absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--text)] opacity-0 shadow-xl transition group-hover:opacity-100">
                  <div className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--muted)]">
                    Due milestones
                  </div>
                  <div className="mt-2 grid gap-1">
                    {milestonesForDay.map((milestone) => (
                      <button
                        key={milestone.id}
                        type="button"
                        className="flex items-start gap-2 text-left text-[0.75rem] text-[var(--text)] transition hover:text-[var(--accent)]"
                        onClick={(event) => {
                          event.stopPropagation();
                          goToMilestone(milestone.id);
                        }}
                      >
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]" />
                        <span className="leading-snug">{milestone.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
