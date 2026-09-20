import { NextRequest, NextResponse } from "next/server";
import { getPitchDetail, getTakenStartTimes } from "@/lib/data/pitches";
import { computeSlotsForDate, todayInRiyadh } from "@/lib/availability";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const dateStr = request.nextUrl.searchParams.get("date") ?? todayInRiyadh();

  const pitch = await getPitchDetail(id);
  if (!pitch) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const taken = await getTakenStartTimes(id, dateStr);
  const slots = computeSlotsForDate({
    dateStr,
    slotDurationMinutes: pitch.pitch.slot_duration_minutes,
    weeklyAvailability: pitch.weeklyAvailability,
    exceptions: pitch.exceptions,
    takenStartTimes: taken,
  });

  return NextResponse.json({ slots });
}
