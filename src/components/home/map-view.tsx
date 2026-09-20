"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { useGoogleMaps } from "@/lib/use-google-maps";
import { localized } from "@/lib/i18n-utils";
import type { PitchListItem } from "@/lib/types/domain";
import { MapPinOff } from "lucide-react";

const RIYADH_CENTER = { lat: 24.7136, lng: 46.6753 };

export function MapView({
  items,
  userLocation,
}: {
  items: PitchListItem[];
  userLocation: { lat: number; lng: number } | null;
}) {
  const status = useGoogleMaps();
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const t = useTranslations("home");
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (status !== "ready" || !mapDivRef.current) return;

    mapRef.current ??= new google.maps.Map(mapDivRef.current, {
      center: userLocation ?? RIYADH_CENTER,
      zoom: userLocation ? 12 : 11,
      mapId: "mala3bak-home-map",
      streetViewControl: false,
      fullscreenControl: false,
    });

    const map = mapRef.current;
    const markers: google.maps.marker.AdvancedMarkerElement[] = [];

    if (userLocation) {
      const dot = document.createElement("div");
      dot.className = "h-3.5 w-3.5 rounded-full bg-blue-500 ring-4 ring-blue-100";
      markers.push(
        new google.maps.marker.AdvancedMarkerElement({
          map,
          position: userLocation,
          content: dot,
        }),
      );
    }

    for (const item of items) {
      const pin = document.createElement("div");
      pin.className =
        "rounded-full bg-primary-600 px-2.5 py-1 text-xs font-bold text-white shadow-md whitespace-nowrap";
      pin.textContent = `${item.pitch.price_per_hour} ﷼`;
      pin.style.cursor = "pointer";
      pin.onclick = () => router.push(`/pitches/${item.pitch.id}`);

      markers.push(
        new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: item.venue.lat, lng: item.venue.lng },
          content: pin,
          title: localized(locale, item.pitch.name_ar, item.pitch.name_en),
        }),
      );
    }

    return () => markers.forEach((m) => (m.map = null));
  }, [status, items, userLocation, locale, router]);

  if (status === "missing-key" || status === "error") {
    return (
      <div className="flex h-[480px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface-muted text-center text-muted-foreground">
        <MapPinOff size={28} />
        <p className="max-w-xs text-sm">
          {status === "missing-key"
            ? "Map view requires a Google Maps API key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)."
            : t("noResults")}
        </p>
      </div>
    );
  }

  return <div ref={mapDivRef} className="h-[480px] w-full rounded-2xl" />;
}
