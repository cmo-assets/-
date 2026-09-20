import { getTranslations } from "next-intl/server";

export async function Footer() {
  const [t, tBrand] = await Promise.all([
    getTranslations("footer"),
    getTranslations("brand"),
  ]);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface-muted">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-8 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">{tBrand("name")}</p>
        <p>{t("ksaOnly")}</p>
        <p>
          © {year} {tBrand("name")} — {t("rights")}
        </p>
      </div>
    </footer>
  );
}
