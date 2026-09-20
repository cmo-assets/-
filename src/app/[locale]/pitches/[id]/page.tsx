import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { getPitchDetail } from "@/lib/data/pitches";
import { getCurrentProfile } from "@/lib/data/auth";
import { localized } from "@/lib/i18n-utils";
import { PitchGallery } from "@/components/pitches/pitch-gallery";
import { ReviewsSection } from "@/components/pitches/reviews-section";
import { BookingWidget } from "@/components/booking/booking-widget";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { MapPin } from "lucide-react";

export default async function PitchDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const appLocale = locale as AppLocale;

  const [t, detail, profile] = await Promise.all([
    getTranslations("pitch"),
    getPitchDetail(id),
    getCurrentProfile(),
  ]);

  if (!detail) notFound();

  const { pitch, venue, images, avgRating, reviewCount, reviews } = detail;
  const name = localized(appLocale, pitch.name_ar, pitch.name_en);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PitchGallery images={images} alt={name} />

          <div>
            <h1 className="text-2xl font-bold">{name}</h1>
            <p className="mt-1 flex items-center gap-1 text-muted-foreground">
              <MapPin size={16} />
              {localized(appLocale, venue.name_ar, venue.name_en)}
              {venue.neighborhood ? ` · ${venue.neighborhood}` : ""} · {venue.city}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{pitch.size}</Badge>
              <Badge variant="outline">{pitch.is_indoor ? "🏟️" : "☀️"}</Badge>
              <span className="text-sm text-muted-foreground">
                {t("capacity", { min: pitch.capacity_min, max: pitch.capacity_max })}
              </span>
              {avgRating && (
                <span className="flex items-center gap-1 text-sm">
                  <RatingStars rating={avgRating} size={14} />
                  {avgRating} ({reviewCount})
                </span>
              )}
            </div>

            <p className="mt-4 text-xl font-bold text-primary-700">
              {t("perHour", { price: pitch.price_per_hour })}
            </p>
          </div>

          {pitch.amenities.length > 0 && (
            <div>
              <h2 className="mb-2 text-lg font-semibold">{t("amenities")}</h2>
              <div className="flex flex-wrap gap-2">
                {pitch.amenities.map((a) => (
                  <Badge key={a}>{a}</Badge>
                ))}
              </div>
            </div>
          )}

          <ReviewsSection pitchId={pitch.id} initialReviews={reviews} isLoggedIn={!!profile} />
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <BookingWidget pitchId={pitch.id} pitch={pitch} isLoggedIn={!!profile} />
        </div>
      </div>
    </div>
  );
}
