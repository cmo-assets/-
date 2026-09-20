import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getPitchDetail } from "@/lib/data/pitches";
import { isMoreThanDaysAhead } from "@/lib/availability";
import { chargeDeposit } from "@/lib/payments/tap";
import { sendBookingConfirmationEmail } from "@/lib/notifications/email";
import { localized } from "@/lib/i18n-utils";

const bodySchema = z.object({
  pitchId: z.string(),
  holdId: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  playerCount: z.number().int().positive(),
  payDeposit: z.boolean(),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { pitchId, holdId, startsAt, endsAt, playerCount, payDeposit } = parsed.data;

  const detail = await getPitchDetail(pitchId);
  if (!detail) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const { pitch } = detail;

  if (playerCount < pitch.capacity_min || playerCount > pitch.capacity_max) {
    return NextResponse.json({ error: "invalid_player_count" }, { status: 400 });
  }

  const needsDepositDecision =
    pitch.deposit_amount > 0 && isMoreThanDaysAhead(startsAt, pitch.advance_booking_deposit_days);
  const depositMandatory = needsDepositDecision && pitch.deposit_required;

  if (depositMandatory && !payDeposit) {
    return NextResponse.json({ error: "deposit_required" }, { status: 400 });
  }

  const shouldChargeDeposit = needsDepositDecision && payDeposit;
  const totalPrice = Math.round((pitch.price_per_hour * pitch.slot_duration_minutes) / 60);

  if (!isSupabaseConfigured) {
    return NextResponse.json({
      booking: {
        id: crypto.randomUUID(),
        status: "confirmed",
        depositStatus: shouldChargeDeposit ? "paid" : "not_required",
        totalPrice,
        startsAt,
      },
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

  const { data: booking, error: insertError } = await supabase
    .from("bookings")
    .insert({
      pitch_id: pitchId,
      user_id: user.id,
      starts_at: startsAt,
      ends_at: endsAt,
      player_count: playerCount,
      total_price: totalPrice,
      status: "confirmed",
      deposit_amount: shouldChargeDeposit ? pitch.deposit_amount : 0,
      deposit_status: shouldChargeDeposit ? "pending" : "not_required",
    })
    .select()
    .single();

  if (insertError) {
    const isConflict = insertError.code === "23505";
    return NextResponse.json(
      { error: isConflict ? "slot_taken" : "booking_failed" },
      { status: isConflict ? 409 : 500 },
    );
  }

  if (shouldChargeDeposit) {
    const charge = await chargeDeposit({
      amountSar: pitch.deposit_amount,
      bookingId: booking.id,
      customerEmail: user.email ?? "",
    });

    await supabase
      .from("payments")
      .insert({
        booking_id: booking.id,
        amount: pitch.deposit_amount,
        status: charge.status,
        provider_charge_id: charge.providerChargeId,
      });

    await supabase
      .from("bookings")
      .update({ deposit_status: charge.status })
      .eq("id", booking.id);
  }

  await supabase
    .from("booking_holds")
    .update({ status: "released" })
    .eq("id", holdId)
    .eq("held_by", user.id);

  if (user.email) {
    await sendBookingConfirmationEmail({
      to: user.email,
      pitchName: localized("ar", pitch.name_ar, pitch.name_en),
      venueName: localized("ar", detail.venue.name_ar, detail.venue.name_en),
      startsAt,
    });
  }

  return NextResponse.json({ booking });
}
