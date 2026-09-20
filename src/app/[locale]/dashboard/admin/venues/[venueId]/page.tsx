import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { getCurrentProfile } from "@/lib/data/auth";
import { createClient } from "@/lib/supabase/server";
import { localized } from "@/lib/i18n-utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createPitch } from "../../actions";

export default async function AdminVenuePage({
  params,
}: {
  params: Promise<{ locale: string; venueId: string }>;
}) {
  const { locale, venueId } = await params;
  setRequestLocale(locale);
  const appLocale = locale as AppLocale;

  const [t, profile] = await Promise.all([getTranslations("dashboard.admin"), getCurrentProfile()]);
  if (!profile || profile.role !== "admin") {
    redirect({ href: "/", locale });
  }

  const supabase = await createClient();
  const [{ data: venue }, { data: pitches }] = await Promise.all([
    supabase.from("venues").select("*").eq("id", venueId).single(),
    supabase.from("pitches").select("*").eq("venue_id", venueId).order("created_at"),
  ]);

  if (!venue) redirect({ href: "/dashboard/admin", locale });

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-bold">{localized(appLocale, venue!.name_ar, venue!.name_en)}</h1>

      <div className="space-y-2">
        {(pitches ?? []).map((pitch) => (
          <Card key={pitch.id} className="flex items-center justify-between p-3">
            <span className="font-medium">{localized(appLocale, pitch.name_ar, pitch.name_en)}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{pitch.size}</Badge>
              <Badge variant="outline">{pitch.price_per_hour} ﷼</Badge>
            </div>
          </Card>
        ))}
      </div>

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">{t("addPitch")}</h2>
        <form action={createPitch.bind(null, venueId)} className="grid grid-cols-2 gap-3" encType="multipart/form-data">
          <Input name="name_ar" placeholder="اسم الملعب بالعربية" required />
          <Input name="name_en" placeholder="Pitch name in English" required />
          <Select name="size" required>
            <option value="5x5">5×5</option>
            <option value="7x7">7×7</option>
            <option value="11x11">11×11</option>
          </Select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_indoor" className="h-4 w-4 accent-[var(--color-primary-600)]" />
            Indoor
          </label>
          <Input name="price_per_hour" type="number" placeholder="Price / hour (SAR)" required />
          <Input name="slot_duration_minutes" type="number" placeholder="Slot minutes (default 60)" />
          <Input name="capacity_min" type="number" placeholder="Min players" required />
          <Input name="capacity_max" type="number" placeholder="Max players" required />
          <Input name="amenities" placeholder="Amenities, comma separated" className="col-span-2" />
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium">{t("uploadImages")}</label>
            <input type="file" name="images" accept="image/*" multiple className="text-sm" />
          </div>
          <Button type="submit" className="col-span-2">
            {t("addPitch")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
