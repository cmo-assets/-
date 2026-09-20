"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PitchSize, UserRole } from "@/lib/types/database";

export async function createVenue(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("venues").insert({
    name_ar: String(formData.get("name_ar")),
    name_en: String(formData.get("name_en")),
    description_ar: String(formData.get("description_ar") || ""),
    description_en: String(formData.get("description_en") || ""),
    city: String(formData.get("city")),
    neighborhood: String(formData.get("neighborhood") || ""),
    address: String(formData.get("address") || ""),
    lat: Number(formData.get("lat")),
    lng: Number(formData.get("lng")),
    created_by: user?.id,
  });

  revalidatePath("/dashboard/admin");
}

export async function createPitch(venueId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: pitch } = await supabase
    .from("pitches")
    .insert({
      venue_id: venueId,
      name_ar: String(formData.get("name_ar")),
      name_en: String(formData.get("name_en")),
      size: String(formData.get("size")) as PitchSize,
      is_indoor: formData.get("is_indoor") === "on",
      amenities: String(formData.get("amenities") || "")
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      price_per_hour: Number(formData.get("price_per_hour")),
      slot_duration_minutes: Number(formData.get("slot_duration_minutes") || 60),
      capacity_min: Number(formData.get("capacity_min")),
      capacity_max: Number(formData.get("capacity_max")),
    })
    .select()
    .single();

  const images = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (pitch && images.length > 0) {
    for (const [index, image] of images.entries()) {
      const path = `${pitch.id}/${Date.now()}-${index}-${image.name}`;
      const { error } = await supabase.storage.from("pitch-images").upload(path, image);
      if (!error) {
        await supabase.from("pitch_images").insert({ pitch_id: pitch.id, storage_path: path, sort_order: index });
      }
    }
  }

  revalidatePath(`/dashboard/admin/venues/${venueId}`);
}

export async function assignRole(formData: FormData) {
  const profileId = String(formData.get("profile_id"));
  const role = String(formData.get("role")) as UserRole;
  const venueId = formData.get("venue_id") ? String(formData.get("venue_id")) : null;

  const admin = createAdminClient();
  await admin.from("profiles").update({ role }).eq("id", profileId);

  if (role === "owner" && venueId) {
    await admin.from("venue_managers").upsert({ venue_id: venueId, profile_id: profileId });
  }

  revalidatePath("/dashboard/admin");
}
