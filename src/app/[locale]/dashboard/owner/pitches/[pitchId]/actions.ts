"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export async function updatePitchSettings(pitchId: string, formData: FormData) {
  const supabase = await createClient();

  await supabase
    .from("pitches")
    .update({
      price_per_hour: Number(formData.get("price_per_hour")),
      slot_duration_minutes: Number(formData.get("slot_duration_minutes")),
      capacity_min: Number(formData.get("capacity_min")),
      capacity_max: Number(formData.get("capacity_max")),
      deposit_required: formData.get("deposit_required") === "on",
      deposit_amount: Number(formData.get("deposit_amount") || 0),
      advance_booking_deposit_days: Number(formData.get("advance_booking_deposit_days") || 5),
    })
    .eq("id", pitchId);

  revalidatePath(`/dashboard/owner/pitches/${pitchId}`);
}

export async function updateWeeklyHours(pitchId: string, formData: FormData) {
  const supabase = await createClient();

  await supabase.from("weekly_availability").delete().eq("pitch_id", pitchId);

  const rows = DAYS.map((day) => ({
    pitch_id: pitchId,
    day_of_week: day,
    start_time: String(formData.get(`start_${day}`) || ""),
    end_time: String(formData.get(`end_${day}`) || ""),
  })).filter((r) => r.start_time && r.end_time);

  if (rows.length > 0) {
    await supabase.from("weekly_availability").insert(rows);
  }

  revalidatePath(`/dashboard/owner/pitches/${pitchId}`);
}

export async function addException(pitchId: string, formData: FormData) {
  const supabase = await createClient();

  await supabase.from("availability_exceptions").insert({
    pitch_id: pitchId,
    date: String(formData.get("date")),
    is_closed: true,
    reason: String(formData.get("reason") || ""),
  });

  revalidatePath(`/dashboard/owner/pitches/${pitchId}`);
}

export async function deleteException(pitchId: string, exceptionId: string) {
  const supabase = await createClient();
  await supabase.from("availability_exceptions").delete().eq("id", exceptionId);
  revalidatePath(`/dashboard/owner/pitches/${pitchId}`);
}
