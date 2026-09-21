import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { getCurrentProfile } from "@/lib/data/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { localized } from "@/lib/i18n-utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createVenue, assignRole } from "./actions";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const appLocale = locale as AppLocale;

  const [t, profile] = await Promise.all([getTranslations("dashboard.admin"), getCurrentProfile()]);
  if (!profile || profile.role !== "admin") {
    redirect({ href: "/", locale });
  }

  const supabase = await createClient();
  const [{ data: venues }, { data: profiles }] = await Promise.all([
    supabase.from("venues").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
  ]);

  let emailById = new Map<string, string>();
  try {
    const admin = createAdminClient();
    const { data: usersPage } = await admin.auth.admin.listUsers({ perPage: 200 });
    emailById = new Map(usersPage.users.map((u) => [u.id, u.email ?? ""]));
  } catch {
    // service-role key not configured in this environment — emails just won't show.
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">{t("addVenue")}</h2>
        <form action={createVenue} className="grid grid-cols-2 gap-3">
          <Input name="name_ar" placeholder="الاسم بالعربية" required />
          <Input name="name_en" placeholder="Name in English" required />
          <Input name="city" placeholder="المدينة / City" required />
          <Input name="neighborhood" placeholder="الحي / Neighborhood" />
          <Input name="address" placeholder="العنوان / Address" className="col-span-2" />
          <Input name="lat" type="number" step="any" placeholder="خط العرض / Latitude" required />
          <Input name="lng" type="number" step="any" placeholder="خط الطول / Longitude" required />
          <textarea
            name="description_ar"
            placeholder="الوصف بالعربية"
            className="col-span-2 rounded-xl border border-border p-2.5 text-sm"
          />
          <textarea
            name="description_en"
            placeholder="Description in English"
            className="col-span-2 rounded-xl border border-border p-2.5 text-sm"
          />
          <Button type="submit" className="col-span-2">
            {t("addVenue")}
          </Button>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 font-semibold">{t("venues")}</h2>
        <div className="space-y-2">
          {(venues ?? []).map((venue) => (
            <Link
              key={venue.id}
              href={`/dashboard/admin/venues/${venue.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 hover:bg-surface-muted"
            >
              <span className="font-medium">{localized(appLocale, venue.name_ar, venue.name_en)}</span>
              <span className="text-sm text-muted-foreground">{venue.city}</span>
            </Link>
          ))}
        </div>
      </div>

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">{t("people")}</h2>
        <div className="space-y-2">
          {(profiles ?? []).map((p) => (
            <form
              key={p.id}
              action={assignRole}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3 text-sm"
            >
              <input type="hidden" name="profile_id" value={p.id} />
              <div className="flex-1">
                <p className="font-medium">{p.full_name || "—"}</p>
                <p className="text-xs text-muted-foreground">{emailById.get(p.id) ?? p.id}</p>
              </div>
              <Label className="sr-only" htmlFor={`role-${p.id}`}>
                {t("roleLabel")}
              </Label>
              <Select id={`role-${p.id}`} name="role" defaultValue={p.role} className="w-32">
                <option value="player">{t("rolePlayer")}</option>
                <option value="owner">{t("roleOwner")}</option>
                <option value="admin">{t("roleAdmin")}</option>
              </Select>
              <Input name="venue_id" placeholder={t("venueIdPlaceholder")} className="w-44" />
              <Button type="submit" size="sm" variant="outline">
                {t("assignRole")}
              </Button>
            </form>
          ))}
        </div>
      </Card>
    </div>
  );
}
