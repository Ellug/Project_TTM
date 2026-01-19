"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import type { Scrum } from "@/lib/types";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";

type ScrumCalendarProps = {
  scrums: Scrum[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const padNumber = (value: number) => value.toString().padStart(2, "0");

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1);
  const day = padNumber(date.getDate());
  return `${year}-${month}-${day}`;
};

export const ScrumCalendar = ({
  scrums,
  selectedDate,
  onSelectDate,
}: ScrumCalendarProps) => {
  const [activeMonth, setActiveMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const scrumsByDate = useMemo(() => {
    const map = new Map<string, Scrum[]>();
    scrums.forEach((scrum) => {
      if (!scrum.date) return;
      const list = map.get(scrum.date);
      if (list) {
        list.push(scrum);
      } else {
        map.set(scrum.date, [scrum]);
      }
    });
    return map;
  }, [scrums]);

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

  return (
    <Card className="p-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
            Scrum calendar
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[var(--text)]">
            Daily scrum tracking
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Select a date to view or add daily scrum entries for your team.
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
          const scrumsForDay = scrumsByDate.get(day.dateKey) ?? [];
          const isToday = day.dateKey === todayKey;
          const hasScrums = scrumsForDay.length > 0;
          const isSelected = day.dateKey === selectedDate;
          const dayLabel = day.date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          const ariaLabel = hasScrums
            ? `${dayLabel}. ${scrumsForDay.length} member${
                scrumsForDay.length > 1 ? "s" : ""
              } with scrum entries`
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
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--accent-fill-strong)] shadow-[inset_0_0_0_1px_var(--accent)]"
                    : hasScrums
                    ? "border-[var(--accent-border-soft)] bg-[var(--accent-fill-strong)] shadow-[inset_0_0_0_1px_var(--accent-fill-strong)]"
                    : "border-[var(--border)] bg-[var(--surface-3)]",
                  "cursor-pointer hover:border-[var(--accent-border)]",
                  isToday && "ring-1 ring-[var(--accent-border)]"
                )}
                onClick={() => onSelectDate(day.dateKey)}
                aria-label={ariaLabel}
                aria-pressed={isSelected}
              >
                <span className="text-sm font-semibold">{day.date.getDate()}</span>
                {hasScrums && (
                  <span className="self-start rounded-full bg-[var(--accent)] px-2 py-[2px] text-[0.6rem] font-semibold uppercase text-[var(--bg)]">
                    {scrumsForDay.length}
                  </span>
                )}
              </button>

              {hasScrums && (
                <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-48 -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--text)] opacity-0 shadow-xl transition group-hover:pointer-events-auto group-hover:opacity-100">
                  <div className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--muted)]">
                    Scrum entries
                  </div>
                  <div className="mt-2 grid gap-1">
                    {scrumsForDay.map((scrum) => (
                      <div
                        key={scrum.id}
                        className="flex items-center gap-2 text-[0.75rem] text-[var(--text)]"
                      >
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]" />
                        <span className="truncate leading-snug">
                          {scrum.userName || "Unknown"}
                        </span>
                        <span className="ml-auto text-[var(--muted)]">
                          {scrum.items.length}
                        </span>
                      </div>
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
