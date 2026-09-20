import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getCurrentProfile } from "@/lib/data/auth";
import { LocaleSwitcher } from "./locale-switcher";
import { LogoutButton } from "./logout-button";
import { Button } from "@/components/ui/button";
import { CalendarCheck2, LayoutDashboard, ShieldCheck } from "lucide-react";

export async function Header() {
  const [t, tBrand, profile] = await Promise.all([
    getTranslations("nav"),
    getTranslations("brand"),
    getCurrentProfile(),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary-800">
          <Image src="/images/logo-mark.svg" alt="" width={32} height={32} />
          <span className="text-lg">{tBrand("name")}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {profile?.role === "admin" && (
            <Link
              href="/dashboard/admin"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium hover:bg-surface-muted"
            >
              <ShieldCheck size={16} />
              {t("adminDashboard")}
            </Link>
          )}
          {profile?.role === "owner" && (
            <Link
              href="/dashboard/owner"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium hover:bg-surface-muted"
            >
              <LayoutDashboard size={16} />
              {t("ownerDashboard")}
            </Link>
          )}
          {profile && (
            <Link
              href="/bookings"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium hover:bg-surface-muted"
            >
              <CalendarCheck2 size={16} />
              {t("myBookings")}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          {profile ? (
            <LogoutButton />
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  {t("login")}
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">{t("signup")}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
