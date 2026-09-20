import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const HOLD_MINUTES = 10;

const bodySchema = z.object({
  pitchId: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { pitchId, startsAt, endsAt } = parsed.data;

  if (!isSupabaseConfigured) {
    // Demo mode: simulate a hold without a live backend so the UI flow is
    // still exercisable. Nothing is persisted, so it can't actually block
    // other users — wire up Supabase env vars to enable real locking.
    return NextResponse.json({
      holdId: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + HOLD_MINUTES * 60_000).toISOString(),
      demo: true,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60_000).toISOString();

  const { data, error } = await supabase
    .from("booking_holds")
    .insert({ pitch_id: pitchId, starts_at: startsAt, ends_at: endsAt, held_by: user.id, expires_at: expiresAt })
    .select()
    .single();

  if (error) {
    const isConflict = error.code === "23505";
    return NextResponse.json(
      { error: isConflict ? "slot_taken" : "hold_failed" },
      { status: isConflict ? 409 : 500 },
    );
  }

  return NextResponse.json({ holdId: data.id, expiresAt: data.expires_at });
}
