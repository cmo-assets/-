import type {
  AvailabilityExceptionRow,
  WeeklyAvailabilityRow,
} from "@/lib/types/database";
import type { TimeSlot } from "@/lib/types/domain";

/** Saudi Arabia is UTC+3 year-round (no DST) — safe to hard-code the offset. */
const RIYADH_OFFSET = "+03:00";

function toRiyadhIso(dateStr: string, timeStr: string) {
  return new Date(`${dateStr}T${timeStr.slice(0, 5)}:00${RIYADH_OFFSET}`).toISOString();
}

function addMinutes(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

/**
 * Builds the bookable slots for one pitch on one calendar date (Riyadh time)
 * from its recurring weekly hours, minus/plus any one-off exceptions, minus
 * whatever is already booked or currently held by another user.
 */
export function computeSlotsForDate({
  dateStr,
  slotDurationMinutes,
  weeklyAvailability,
  exceptions,
  takenStartTimes,
}: {
  dateStr: string; // "YYYY-MM-DD"
  slotDurationMinutes: number;
  weeklyAvailability: WeeklyAvailabilityRow[];
  exceptions: AvailabilityExceptionRow[];
  takenStartTimes: Set<string>; // ISO starts_at already booked/held
}): TimeSlot[] {
  const dayOfWeek = new Date(`${dateStr}T12:00:00${RIYADH_OFFSET}`).getUTCDay();
  const dayExceptions = exceptions.filter((e) => e.date === dateStr);
  const fullDayClosed = dayExceptions.some((e) => e.is_closed && !e.start_time);

  if (fullDayClosed) return [];

  const windows = [
    ...weeklyAvailability
      .filter((w) => w.day_of_week === dayOfWeek)
      .map((w) => ({ start: w.start_time, end: w.end_time })),
    ...dayExceptions
      .filter((e) => !e.is_closed && e.start_time && e.end_time)
      .map((e) => ({ start: e.start_time as string, end: e.end_time as string })),
  ];

  const closedRanges = dayExceptions
    .filter((e) => e.is_closed && e.start_time && e.end_time)
    .map((e) => ({
      start: toRiyadhIso(dateStr, e.start_time as string),
      end: toRiyadhIso(dateStr, e.end_time as string),
    }));

  const slots: TimeSlot[] = [];

  for (const window of windows) {
    let cursor = toRiyadhIso(dateStr, window.start);
    const windowEnd = toRiyadhIso(dateStr, window.end);

    while (addMinutes(cursor, slotDurationMinutes) <= windowEnd) {
      const startsAt = cursor;
      const endsAt = addMinutes(cursor, slotDurationMinutes);
      const blockedByException = closedRanges.some(
        (r) => startsAt < r.end && endsAt > r.start,
      );

      slots.push({
        startsAt,
        endsAt,
        isAvailable: !blockedByException && !takenStartTimes.has(startsAt),
      });

      cursor = endsAt;
    }
  }

  return slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function formatRiyadhTime(iso: string, locale: "ar" | "en") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Riyadh",
  }).format(new Date(iso));
}

export function todayInRiyadh() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

export function isMoreThanDaysAhead(iso: string, days: number) {
  const diffMs = new Date(iso).getTime() - Date.now();
  return diffMs > days * 24 * 60 * 60 * 1000;
}
