"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { List, MapIcon, LocateFixed } from "lucide-react";
import { FilterBar } from "./filter-bar";
import { MapView } from "./map-view";
import { PitchCard } from "@/components/pitches/pitch-card";
import { Button } from "@/components/ui/button";
import { distanceKm } from "@/lib/geo";
import type { HomeFilters, PitchListItem } from "@/lib/types/domain";

export function HomeExplorer({ items }: { items: PitchListItem[] }) {
  const t = useTranslations("home");
  const [filters, setFilters] = useState<HomeFilters>({
    query: "",
    size: "any",
    indoor: "any",
    availableToday: false,
  });
  const [view, setView] = useState<"list" | "map">("list");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError(false);
      },
      () => setLocationError(true),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  const filtered = useMemo(() => {
    const query = filters.query?.trim().toLowerCase() ?? "";

    const withDistance = items
      .filter((item) => {
        if (filters.size && filters.size !== "any" && item.pitch.size !== filters.size) {
          return false;
        }
        if (filters.indoor === "indoor" && !item.pitch.is_indoor) return false;
        if (filters.indoor === "outdoor" && item.pitch.is_indoor) return false;
        if (filters.availableToday && !item.hasSlotsToday) return false;
        if (query) {
          const haystack = [
            item.pitch.name_ar,
            item.pitch.name_en,
            item.venue.name_ar,
            item.venue.name_en,
            item.venue.neighborhood ?? "",
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      })
      .map((item) => ({
        item,
        distance: location ? distanceKm(location, item.venue) : undefined,
      }));

    if (location) {
      withDistance.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }

    return withDistance;
  }, [items, filters, location]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" size="sm" onClick={requestLocation} type="button">
          <LocateFixed size={16} />
          {t("useMyLocation")}
        </Button>

        <div className="inline-flex rounded-xl border border-border p-1">
          <button
            onClick={() => setView("list")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
              view === "list" ? "bg-primary-600 text-white" : "text-muted-foreground"
            }`}
          >
            <List size={15} />
            {t("viewList")}
          </button>
          <button
            onClick={() => setView("map")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
              view === "map" ? "bg-primary-600 text-white" : "text-muted-foreground"
            }`}
          >
            <MapIcon size={15} />
            {t("viewMap")}
          </button>
        </div>
      </div>

      {locationError && <p className="text-sm text-warning">{t("locationDenied")}</p>}

      <FilterBar filters={filters} onChange={setFilters} />

      <p className="text-sm text-muted-foreground">
        {t("resultsCount", { count: filtered.length })}
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
          {t("noResults")}
        </p>
      ) : view === "list" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ item, distance }) => (
            <PitchCard key={item.pitch.id} item={item} distanceKm={distance} />
          ))}
        </div>
      ) : (
        <MapView items={filtered.map((f) => f.item)} userLocation={location} />
      )}
    </div>
  );
}
