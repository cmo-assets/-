import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPitchListItemsForHome } from "@/lib/data/pitches";
import { HomeExplorer } from "@/components/home/home-explorer";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, items] = await Promise.all([
    getTranslations("home"),
    getPitchListItemsForHome(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="rounded-3xl bg-gradient-to-br from-primary-700 to-primary-500 px-6 py-10 text-white sm:px-10 sm:py-14">
        <h1 className="max-w-xl text-3xl font-extrabold sm:text-4xl">{t("heroTitle")}</h1>
        <p className="mt-3 max-w-lg text-primary-50">{t("heroSubtitle")}</p>
      </div>

      <HomeExplorer items={items} />
    </div>
  );
}
