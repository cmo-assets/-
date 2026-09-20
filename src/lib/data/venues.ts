import { createClient } from "@/lib/supabase/server";
import type { PitchRow, VenueRow } from "@/lib/types/database";

export async function getManagedVenues(profileId: string, isAdmin: boolean) {
  const supabase = await createClient();

  let venueIds: string[] | null = null;
  if (!isAdmin) {
    const { data: managed } = await supabase
      .from("venue_managers")
      .select("venue_id")
      .eq("profile_id", profileId);
    venueIds = (managed ?? []).map((m) => m.venue_id);
    if (venueIds.length === 0) return [];
  }

  let query = supabase.from("venues").select("*").order("created_at", { ascending: false });
  if (venueIds) query = query.in("id", venueIds);
  const { data: venues } = await query;
  if (!venues || venues.length === 0) return [];

  const { data: pitches } = await supabase
    .from("pitches")
    .select("*")
    .in(
      "venue_id",
      venues.map((v) => v.id),
    )
    .order("created_at", { ascending: true });

  return venues.map((venue) => ({
    venue,
    pitches: (pitches ?? []).filter((p) => p.venue_id === venue.id),
  })) satisfies { venue: VenueRow; pitches: PitchRow[] }[];
}

export async function getPitchForManager(pitchId: string) {
  const supabase = await createClient();
  const { data: pitch } = await supabase.from("pitches").select("*").eq("id", pitchId).single();
  if (!pitch) return null;

  const [{ data: venue }, { data: weeklyAvailability }, { data: exceptions }] = await Promise.all([
    supabase.from("venues").select("*").eq("id", pitch.venue_id).single(),
    supabase.from("weekly_availability").select("*").eq("pitch_id", pitchId).order("day_of_week"),
    supabase
      .from("availability_exceptions")
      .select("*")
      .eq("pitch_id", pitchId)
      .order("date", { ascending: false }),
  ]);

  return { pitch, venue, weeklyAvailability: weeklyAvailability ?? [], exceptions: exceptions ?? [] };
}

export async function getBookingsForPitchOnDate(pitchId: string, dateStr: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("pitch_id", pitchId)
    .eq("status", "confirmed")
    .gte("starts_at", `${dateStr}T00:00:00+03:00`)
    .lte("starts_at", `${dateStr}T23:59:59+03:00`)
    .order("starts_at");
  return data ?? [];
}
