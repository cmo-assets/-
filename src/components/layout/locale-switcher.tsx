"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { Languages } from "lucide-react";

export function LocaleSwitcher() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  function toggle() {
    const nextLocale = locale === "ar" ? "en" : "ar";
    router.replace(
      // @ts-expect-error -- pathname comes from the current route, safe to reuse
      { pathname, params },
      { locale: nextLocale },
    );
  }

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted"
    >
      <Languages size={16} />
      {t("language")}
    </button>
  );
}
