import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  MOCK_EXCEPTIONS,
  MOCK_REVIEWS,
  MOCK_WEEKLY_AVAILABILITY,
  buildMockPitchListItems,
} from "@/lib/data/mock";
import { computeSlotsForDate, todayInRiyadh } from "@/lib/availability";
import type { PitchDetail, PitchListItem } from "@/lib/types/domain";

export async function getPitchListItems(): Promise<PitchListItem[]> {
  if (!isSupabaseConfigured) return buildMockPitchListItems();

  const supabase = await createClient();
  const [{ data: pitches }, { data: venues }, { data: images }, { data: ratings }] =
    await Promise.all([
      supabase.from("pitch_public").select("*"),
      supabase.from("venue_public").select("*"),
      supabase.from("pitch_images").select("*").order("sort_order"),
      supabase.from("pitch_rating_public").select("*"),
    ]);

  const venueById = new Map((venues ?? []).map((v) => [v.id, v]));
  const ratingByPitch = new Map((ratings ?? []).map((r) => [r.pitch_id, r]));

  return (pitches ?? [])
    .map((pitch) => {
      const venue = venueById.get(pitch.venue_id);
      if (!venue) return null;

      const pitchImages = (images ?? [])
        .filter((img) => img.pitch_id === pitch.id)
        .map((img) => supabase.storage.from("pitch-images").getPublicUrl(img.storage_path).data.publicUrl);

      const rating = ratingByPitch.get(pitch.id);

      return {
        pitch,
        venue,
        images: pitchImages.length ? pitchImages : ["/images/pitch-placeholder-1.svg"],
        avgRating: rating ? Number(rating.avg_rating) : null,
        reviewCount: rating?.review_count ?? 0,
      } satisfies PitchListItem;
    })
    .filter((item): item is PitchListItem => item !== null);
}

export async function getPitchDetail(pitchId: string): Promise<PitchDetail | null> {
  const items = await getPitchListItems();
  const base = items.find((item) => item.pitch.id === pitchId);
  if (!base) return null;

  if (!isSupabaseConfigured) {
    return {
      ...base,
      weeklyAvailability: MOCK_WEEKLY_AVAILABILITY.filter((w) => w.pitch_id === pitchId),
      exceptions: MOCK_EXCEPTIONS.filter((e) => e.pitch_id === pitchId),
      reviews: MOCK_REVIEWS.filter((r) => r.pitch_id === pitchId).map((r) => ({
        ...r,
        authorInitial: "ل",
      })),
    };
  }

  const supabase = await createClient();
  const [{ data: weeklyAvailability }, { data: exceptions }, { data: reviews }] =
    await Promise.all([
      supabase.from("weekly_availability").select("*").eq("pitch_id", pitchId),
      supabase.from("availability_exceptions").select("*").eq("pitch_id", pitchId),
      supabase.from("reviews").select("*").eq("pitch_id", pitchId).order("created_at", { ascending: false }),
    ]);

  return {
    ...base,
    weeklyAvailability: weeklyAvailability ?? [],
    exceptions: exceptions ?? [],
    reviews: (reviews ?? []).map((r) => ({ ...r, authorInitial: "•" })),
  };
}

/** Home feed: pitch cards annotated with whether they have any open slot today. */
export async function getPitchListItemsForHome(): Promise<PitchListItem[]> {
  const items = await getPitchListItems();
  const today = todayInRiyadh();

  return Promise.all(
    items.map(async (item) => {
      const [weeklyAvailability, exceptions, taken] = await Promise.all([
        getWeeklyAvailability(item.pitch.id),
        getExceptions(item.pitch.id),
        getTakenStartTimes(item.pitch.id, today),
      ]);

      const slots = computeSlotsForDate({
        dateStr: today,
        slotDurationMinutes: item.pitch.slot_duration_minutes,
        weeklyAvailability,
        exceptions,
        takenStartTimes: taken,
      });

      return { ...item, hasSlotsToday: slots.some((s) => s.isAvailable) };
    }),
  );
}

async function getWeeklyAvailability(pitchId: string) {
  if (!isSupabaseConfigured) {
    return MOCK_WEEKLY_AVAILABILITY.filter((w) => w.pitch_id === pitchId);
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("weekly_availability")
    .select("*")
    .eq("pitch_id", pitchId);
  return data ?? [];
}

async function getExceptions(pitchId: string) {
  if (!isSupabaseConfigured) {
    return MOCK_EXCEPTIONS.filter((e) => e.pitch_id === pitchId);
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("availability_exceptions")
    .select("*")
    .eq("pitch_id", pitchId);
  return data ?? [];
}

/** ISO starts_at values already confirmed or actively held for a given date. */
export async function getTakenStartTimes(
  pitchId: string,
  dateStr: string,
): Promise<Set<string>> {
  if (!isSupabaseConfigured) return new Set();

  const supabase = await createClient();
  const dayStart = `${dateStr}T00:00:00+03:00`;
  const dayEnd = `${dateStr}T23:59:59+03:00`;

  const [{ data: bookings }, { data: holds }] = await Promise.all([
    supabase
      .from("bookings")
      .select("starts_at")
      .eq("pitch_id", pitchId)
      .eq("status", "confirmed")
      .gte("starts_at", dayStart)
      .lte("starts_at", dayEnd),
    supabase
      .from("booking_holds")
      .select("starts_at, expires_at")
      .eq("pitch_id", pitchId)
      .eq("status", "active")
      .gte("starts_at", dayStart)
      .lte("starts_at", dayEnd),
  ]);

  const now = new Date().toISOString();
  const taken = new Set((bookings ?? []).map((b) => b.starts_at));
  for (const hold of holds ?? []) {
    if (hold.expires_at > now) taken.add(hold.starts_at);
  }
  return taken;
}
