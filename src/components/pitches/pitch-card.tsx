import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import type { PitchListItem } from "@/lib/types/domain";
import { localized, formatSar } from "@/lib/i18n-utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { MapPin } from "lucide-react";

export function PitchCard({
  item,
  distanceKm,
}: {
  item: PitchListItem;
  distanceKm?: number;
}) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("pitch");
  const tHome = useTranslations("home");
  const tFilters = useTranslations("filters");

  return (
    <Link href={`/pitches/${item.pitch.id}`}>
      <Card className="group h-full overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-muted">
          <Image
            src={item.images[0]}
            alt={localized(locale, item.pitch.name_ar, item.pitch.name_en)}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 320px, 100vw"
          />
          {item.hasSlotsToday && (
            <Badge className="absolute top-2 start-2 bg-surface text-primary-700 shadow-sm">
              {tFilters("availableToday")}
            </Badge>
          )}
        </div>

        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground">
              {localized(locale, item.pitch.name_ar, item.pitch.name_en)}
            </h3>
            <span className="whitespace-nowrap text-sm font-semibold text-primary-700">
              {formatSar(locale, item.pitch.price_per_hour)}
            </span>
          </div>

          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin size={14} />
            {localized(locale, item.venue.name_ar, item.venue.name_en)}
            {item.venue.neighborhood ? ` · ${item.venue.neighborhood}` : ""}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Badge variant="outline">{item.pitch.size}</Badge>
            <Badge variant="outline">
              {item.pitch.is_indoor ? tFilters("indoorOnly") : tFilters("outdoorOnly")}
            </Badge>
          </div>

          <div className="flex items-center justify-between pt-1">
            {item.avgRating ? (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <RatingStars rating={item.avgRating} size={14} />
                <span>({item.reviewCount})</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">{t("noReviews")}</span>
            )}
            {distanceKm !== undefined && (
              <span className="text-xs text-muted-foreground">
                {tHome("distanceAway", { distance: distanceKm.toFixed(1) })}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
