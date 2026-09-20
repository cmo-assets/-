"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DateStrip } from "./date-strip";
import { formatRiyadhTime, isMoreThanDaysAhead, todayInRiyadh } from "@/lib/availability";
import { formatSar } from "@/lib/i18n-utils";
import type { PitchPublicRow } from "@/lib/types/database";
import type { TimeSlot } from "@/lib/types/domain";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";

type Step = "select" | "holding" | "confirmed";

export function BookingWidget({
  pitchId,
  pitch,
  isLoggedIn,
}: {
  pitchId: string;
  pitch: PitchPublicRow;
  isLoggedIn: boolean;
}) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("pitch");

  const [date, setDate] = useState(todayInRiyadh());
  const [slots, setSlots] = useState<TimeSlot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [step, setStep] = useState<Step>("select");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [holdId, setHoldId] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState(pitch.capacity_min);
  const [payDeposit, setPayDeposit] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadSlots = async () => {
      setLoadingSlots(true);
      const res = await fetch(`/api/pitches/${pitchId}/slots?date=${date}`);
      const data = await res.json();
      if (cancelled) return;
      setSlots(data.slots ?? []);
      setLoadingSlots(false);
    };
    loadSlots();
    return () => {
      cancelled = true;
    };
  }, [pitchId, date]);

  const [remainingMs, setRemainingMs] = useState(0);
  useEffect(() => {
    if (!holdExpiresAt) return;
    // A single effect owns both the countdown display and the expiry action,
    // so the "expired" check always uses the value it just computed rather
    // than a stale `remainingMs` from a previous render (which raced the
    // hold being granted and released it instantly).
    const tick = () => {
      const remaining = new Date(holdExpiresAt).getTime() - Date.now();
      setRemainingMs(remaining);
      if (remaining <= 0) {
        setStep("select");
        setSelectedSlot(null);
        setHoldId(null);
        setHoldExpiresAt(null);
        setError(null);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  const needsDepositDecision =
    selectedSlot !== null &&
    pitch.deposit_amount > 0 &&
    isMoreThanDaysAhead(selectedSlot.startsAt, pitch.advance_booking_deposit_days);
  const depositMandatory = needsDepositDecision && pitch.deposit_required;

  const capacityOptions = useMemo(
    () =>
      Array.from(
        { length: pitch.capacity_max - pitch.capacity_min + 1 },
        (_, i) => pitch.capacity_min + i,
      ),
    [pitch.capacity_min, pitch.capacity_max],
  );

  async function selectSlot(slot: TimeSlot) {
    setError(null);
    const res = await fetch("/api/bookings/hold", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pitchId, startsAt: slot.startsAt, endsAt: slot.endsAt }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "hold_failed");
      return;
    }
    setSelectedSlot(slot);
    setHoldId(data.holdId);
    setHoldExpiresAt(data.expiresAt);
    setStep("holding");
  }

  async function confirmBooking() {
    if (!selectedSlot || !holdId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pitchId,
          holdId,
          startsAt: selectedSlot.startsAt,
          endsAt: selectedSlot.endsAt,
          playerCount,
          payDeposit: needsDepositDecision ? payDeposit : false,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "booking_failed");
        return;
      }
      setConfirmedTotal(data.booking.totalPrice ?? data.booking.total_price ?? null);
      setStep("confirmed");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "confirmed") {
    return (
      <div className="space-y-3 rounded-2xl border border-primary-200 bg-primary-50 p-5 text-center">
        <CheckCircle2 className="mx-auto text-primary-600" size={32} />
        <p className="font-semibold text-primary-800">{t("bookingConfirmed")}</p>
        <p className="text-sm text-primary-700">{t("bookingConfirmedBody")}</p>
        {confirmedTotal !== null && (
          <p className="text-sm font-medium text-primary-800">
            {formatSar(locale, confirmedTotal)}
          </p>
        )}
        <Link href="/bookings">
          <Button size="sm" variant="secondary">
            {t("title")}
          </Button>
        </Link>
      </div>
    );
  }

  if (step === "holding" && selectedSlot) {
    const minutes = Math.max(0, Math.floor(remainingMs / 60000));
    const seconds = Math.max(0, Math.floor((remainingMs % 60000) / 1000));

    return (
      <div className="space-y-4 rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
          <Clock size={16} />
          {t("slotHeld")} — {minutes}:{seconds.toString().padStart(2, "0")}
        </div>

        <p className="font-medium">
          {formatRiyadhTime(selectedSlot.startsAt, locale)} –{" "}
          {formatRiyadhTime(selectedSlot.endsAt, locale)}
        </p>

        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("playerCount")}</label>
          <Select value={playerCount} onChange={(e) => setPlayerCount(Number(e.target.value))}>
            {capacityOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>

        {needsDepositDecision ? (
          <div className="space-y-2 rounded-xl bg-surface-muted p-3 text-sm">
            <p>
              {depositMandatory
                ? t("depositRequired", { amount: pitch.deposit_amount })
                : t("depositOptional", { amount: pitch.deposit_amount })}
            </p>
            {!depositMandatory && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={payDeposit}
                  onChange={(e) => setPayDeposit(e.target.checked)}
                  className="h-4 w-4 accent-[var(--color-primary-600)]"
                />
                {t("payDeposit")}
              </label>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("payAtVenue")}</p>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        {isLoggedIn ? (
          <Button className="w-full" onClick={confirmBooking} disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" size={16} />}
            {needsDepositDecision && (depositMandatory || payDeposit)
              ? t("payDeposit")
              : t("confirmBooking")}
          </Button>
        ) : (
          <Link href="/login" className="block">
            <Button className="w-full" variant="secondary">
              {t("loginToBook")}
            </Button>
          </Link>
        )}

        <p className="text-center text-xs text-muted-foreground">{t("cancelPolicy")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-5">
      <p className="font-semibold">{t("selectDate")}</p>
      <DateStrip selected={date} onSelect={setDate} />

      <p className="font-semibold">{t("availableSlots")}</p>
      {loadingSlots ? (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : slots && slots.some((s) => s.isAvailable) ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots
            .filter((s) => s.isAvailable)
            .map((slot) => (
              <button
                key={slot.startsAt}
                onClick={() => selectSlot(slot)}
                className="rounded-xl border border-border py-2 text-sm font-medium hover:border-primary-500 hover:bg-primary-50"
              >
                {formatRiyadhTime(slot.startsAt, locale)}
              </button>
            ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">{t("noSlotsToday")}</p>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
