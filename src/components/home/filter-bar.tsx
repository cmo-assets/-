"use client";

import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { HomeFilters } from "@/lib/types/domain";

export function FilterBar({
  filters,
  onChange,
}: {
  filters: HomeFilters;
  onChange: (next: HomeFilters) => void;
}) {
  const t = useTranslations("filters");
  const tHome = useTranslations("home");

  const hasActiveFilters =
    filters.size !== "any" || filters.indoor !== "any" || filters.availableToday;

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3.5 text-muted-foreground"
        />
        <Input
          value={filters.query ?? ""}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder={tHome("searchPlaceholder")}
          className="ps-10"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Select
          value={filters.size ?? "any"}
          onChange={(e) =>
            onChange({ ...filters, size: e.target.value as HomeFilters["size"] })
          }
        >
          <option value="any">{t("sizeAny")}</option>
          <option value="5x5">5×5</option>
          <option value="7x7">7×7</option>
          <option value="11x11">11×11</option>
        </Select>

        <Select
          value={filters.indoor ?? "any"}
          onChange={(e) =>
            onChange({ ...filters, indoor: e.target.value as HomeFilters["indoor"] })
          }
        >
          <option value="any">{t("indoorAny")}</option>
          <option value="indoor">{t("indoorOnly")}</option>
          <option value="outdoor">{t("outdoorOnly")}</option>
        </Select>

        <label className="flex items-center gap-2 rounded-xl border border-border px-3.5 text-sm sm:col-span-1">
          <input
            type="checkbox"
            checked={filters.availableToday ?? false}
            onChange={(e) => onChange({ ...filters, availableToday: e.target.checked })}
            className="h-4 w-4 accent-[var(--color-primary-600)]"
          />
          {t("availableToday")}
        </label>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ query: filters.query, size: "any", indoor: "any", availableToday: false })}
            className="justify-self-start"
          >
            <X size={14} />
            {t("clear")}
          </Button>
        )}
      </div>
    </div>
  );
}
