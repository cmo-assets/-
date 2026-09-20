import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { getCurrentProfile } from "@/lib/data/auth";
import { getManagedVenues } from "@/lib/data/venues";
import { localized } from "@/lib/i18n-utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function OwnerDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const appLocale = locale as AppLocale;

  const [t, profile] = await Promise.all([getTranslations("dashboard.owner"), getCurrentProfile()]);

  if (!profile || (profile.role !== "owner" && profile.role !== "admin")) {
    redirect({ href: "/", locale });
  }

  const managed = await getManagedVenues(profile!.id, profile!.role === "admin");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
      <h2 className="mb-3 text-lg font-semibold">{t("venues")}</h2>

      {managed.length === 0 ? (
        <p className="text-muted-foreground">—</p>
      ) : (
        <div className="space-y-6">
          {managed.map(({ venue, pitches }) => (
            <Card key={venue.id} className="p-4">
              <h3 className="font-semibold">{localized(appLocale, venue.name_ar, venue.name_en)}</h3>
              <p className="text-sm text-muted-foreground">{venue.neighborhood ?? venue.city}</p>

              <div className="mt-3 space-y-2">
                {pitches.map((pitch) => (
                  <Link
                    key={pitch.id}
                    href={`/dashboard/owner/pitches/${pitch.id}`}
                    className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-surface-muted"
                  >
                    <span className="font-medium">
                      {localized(appLocale, pitch.name_ar, pitch.name_en)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{pitch.size}</Badge>
                      <Badge variant="outline">{pitch.price_per_hour} ﷼</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
