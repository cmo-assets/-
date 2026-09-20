"use client";

import { useLocale } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { todayInRiyadh } from "@/lib/availability";

function nextDates(count: number) {
  const start = new Date(`${todayInRiyadh()}T12:00:00+03:00`);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function DateStrip({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (date: string) => void;
}) {
  const locale = useLocale() as AppLocale;
  const dates = nextDates(14);
  const weekdayFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    weekday: "short",
    timeZone: "Asia/Riyadh",
  });
  const dayFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    day: "numeric",
    timeZone: "Asia/Riyadh",
    calendar: "gregory",
  });

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {dates.map((date) => {
        const d = new Date(`${date}T12:00:00+03:00`);
        const isSelected = date === selected;
        return (
          <button
            key={date}
            onClick={() => onSelect(date)}
            className={cn(
              "flex w-14 shrink-0 flex-col items-center rounded-xl border px-2 py-2 text-sm",
              isSelected
                ? "border-primary-600 bg-primary-600 text-white"
                : "border-border bg-surface hover:bg-surface-muted",
            )}
          >
            <span className="text-xs opacity-80">{weekdayFmt.format(d)}</span>
            <span className="font-semibold">{dayFmt.format(d)}</span>
          </button>
        );
      })}
    </div>
  );
}
