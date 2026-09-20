import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { getCurrentProfile } from "@/lib/data/auth";
import { getBookingsForPitchOnDate, getPitchForManager } from "@/lib/data/venues";
import { createClient } from "@/lib/supabase/server";
import { localized, formatSar } from "@/lib/i18n-utils";
import { formatRiyadhTime, todayInRiyadh } from "@/lib/availability";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { addException, deleteException, updatePitchSettings, updateWeeklyHours } from "./actions";

const WEEKDAY_REF_DATES = [
  "2023-01-01", // Sunday
  "2023-01-02",
  "2023-01-03",
  "2023-01-04",
  "2023-01-05",
  "2023-01-06",
  "2023-01-07",
];

export default async function ManagePitchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; pitchId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { locale, pitchId } = await params;
  const { date } = await searchParams;
  setRequestLocale(locale);
  const appLocale = locale as AppLocale;
  const selectedDate = date ?? todayInRiyadh();

  const [t, profile] = await Promise.all([getTranslations("dashboard.owner"), getCurrentProfile()]);
  if (!profile || (profile.role !== "owner" && profile.role !== "admin")) {
    redirect({ href: "/", locale });
  }

  const data = await getPitchForManager(pitchId);
  if (!data?.venue) redirect({ href: "/dashboard/owner", locale });
  const { pitch, venue, weeklyAvailability, exceptions } = data!;

  const [dayBookings, allBookings] = await Promise.all([
    getBookingsForPitchOnDate(pitchId, selectedDate),
    (async () => {
      const supabase = await createClient();
      const { data: bookings } = await supabase
        .from("bookings")
        .select("starts_at")
        .eq("pitch_id", pitchId)
        .eq("status", "confirmed");
      return bookings ?? [];
    })(),
  ]);

  const bookedDates = new Set(
    allBookings.map((b) =>
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date(b.starts_at)),
    ),
  );

  const weekdayFmt = new Intl.DateTimeFormat(appLocale === "ar" ? "ar-SA" : "en-SA", { weekday: "long" });
  const hoursByDay = new Map(weeklyAvailability.map((w) => [w.day_of_week, w]));

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div>
        <p className="text-sm text-muted-foreground">
          {localized(appLocale, venue!.name_ar, venue!.name_en)}
        </p>
        <h1 className="text-2xl font-bold">{localized(appLocale, pitch.name_ar, pitch.name_en)}</h1>
      </div>

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">{t("pitchSettings")}</h2>
        <form action={updatePitchSettings.bind(null, pitchId)} className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price_per_hour">{t("priceLabel")}</Label>
            <Input id="price_per_hour" name="price_per_hour" type="number" defaultValue={pitch.price_per_hour} />
          </div>
          <div>
            <Label htmlFor="slot_duration_minutes">Slot (min)</Label>
            <Input
              id="slot_duration_minutes"
              name="slot_duration_minutes"
              type="number"
              step={15}
              defaultValue={pitch.slot_duration_minutes}
            />
          </div>
          <div>
            <Label htmlFor="capacity_min">Min players</Label>
            <Input id="capacity_min" name="capacity_min" type="number" defaultValue={pitch.capacity_min} />
          </div>
          <div>
            <Label htmlFor="capacity_max">Max players</Label>
            <Input id="capacity_max" name="capacity_max" type="number" defaultValue={pitch.capacity_max} />
          </div>
          <div>
            <Label htmlFor="deposit_amount">{t("depositAmountLabel")}</Label>
            <Input id="deposit_amount" name="deposit_amount" type="number" defaultValue={pitch.deposit_amount} />
          </div>
          <div>
            <Label htmlFor="advance_booking_deposit_days">Deposit threshold (days)</Label>
            <Input
              id="advance_booking_deposit_days"
              name="advance_booking_deposit_days"
              type="number"
              defaultValue={pitch.advance_booking_deposit_days}
            />
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="deposit_required"
              defaultChecked={pitch.deposit_required}
              className="h-4 w-4 accent-[var(--color-primary-600)]"
            />
            {t("depositRequiredLabel")}
          </label>
          <Button type="submit" className="col-span-2">
            Save
          </Button>
        </form>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">{t("weeklyHours")}</h2>
        <form action={updateWeeklyHours.bind(null, pitchId)} className="space-y-2">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => {
            const existing = hoursByDay.get(day);
            return (
              <div key={day} className="grid grid-cols-3 items-center gap-2">
                <span className="text-sm capitalize">
                  {weekdayFmt.format(new Date(`${WEEKDAY_REF_DATES[day]}T12:00:00`))}
                </span>
                <Input
                  type="time"
                  name={`start_${day}`}
                  defaultValue={existing?.start_time.slice(0, 5)}
                />
                <Input type="time" name={`end_${day}`} defaultValue={existing?.end_time.slice(0, 5)} />
              </div>
            );
          })}
          <Button type="submit" size="sm">
            Save
          </Button>
        </form>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">{t("addException")}</h2>
        <form action={addException.bind(null, pitchId)} className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" required />
          </div>
          <div className="flex-1">
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" name="reason" placeholder="Maintenance..." />
          </div>
          <Button type="submit" size="sm">
            Save
          </Button>
        </form>

        {exceptions.length > 0 && (
          <ul className="space-y-2">
            {exceptions.map((exception) => (
              <li
                key={exception.id}
                className="flex items-center justify-between rounded-xl border border-border p-2.5 text-sm"
              >
                <span>
                  {exception.date} {exception.reason ? `— ${exception.reason}` : ""}
                </span>
                <div className="flex items-center gap-2">
                  {bookedDates.has(exception.date) && (
                    <Badge variant="warning">{t("conflictWarning")}</Badge>
                  )}
                  <form action={deleteException.bind(null, pitchId, exception.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Remove
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">{t("calendar")}</h2>
        <form className="flex items-center gap-2">
          <Input type="date" name="date" defaultValue={selectedDate} />
          <Button type="submit" size="sm" variant="outline">
            Go
          </Button>
        </form>

        {dayBookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : (
          <ul className="space-y-2">
            {dayBookings.map((booking) => (
              <li
                key={booking.id}
                className="flex items-center justify-between rounded-xl border border-border p-2.5 text-sm"
              >
                <span>{formatRiyadhTime(booking.starts_at, appLocale)}</span>
                <span>{booking.player_count} players</span>
                <span className="font-medium">{formatSar(appLocale, booking.total_price)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
