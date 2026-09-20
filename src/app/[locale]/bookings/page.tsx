import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { getCurrentProfile } from "@/lib/data/auth";
import { getPitchListItems } from "@/lib/data/pitches";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { localized, formatSar } from "@/lib/i18n-utils";
import { formatRiyadhTime } from "@/lib/availability";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function BookingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const appLocale = locale as AppLocale;

  const [t, tStatus, tDeposit, profile] = await Promise.all([
    getTranslations("booking"),
    getTranslations("booking.status"),
    getTranslations("booking.deposit"),
    getCurrentProfile(),
  ]);

  if (!profile) redirect({ href: "/login", locale });

  const pitchItems = await getPitchListItems();
  const pitchById = new Map(pitchItems.map((item) => [item.pitch.id, item]));

  let bookings: {
    id: string;
    pitch_id: string;
    starts_at: string;
    status: string;
    deposit_status: string;
    total_price: number;
  }[] = [];

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", profile!.id)
      .order("starts_at", { ascending: false });
    bookings = data ?? [];
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>

      {bookings.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const item = pitchById.get(booking.pitch_id);
            return (
              <Card key={booking.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">
                    {item ? localized(appLocale, item.pitch.name_ar, item.pitch.name_en) : booking.pitch_id}
                  </p>
                  {item && (
                    <p className="text-sm text-muted-foreground">
                      {localized(appLocale, item.venue.name_ar, item.venue.name_en)}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {formatRiyadhTime(booking.starts_at, appLocale)} —{" "}
                    {new Date(booking.starts_at).toLocaleDateString(appLocale === "ar" ? "ar-SA" : "en-SA", {
                      calendar: "gregory",
                    })}
                  </p>
                </div>
                <div className="space-y-1 text-end">
                  <Badge>{tStatus(booking.status as "confirmed")}</Badge>
                  <p className="text-sm font-semibold">{formatSar(appLocale, booking.total_price)}</p>
                  <p className="text-xs text-muted-foreground">
                    {tDeposit(booking.deposit_status as "not_required")}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
