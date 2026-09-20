import { getTranslations, setRequestLocale } from "next-intl/server";
import { VerifyOtpForm } from "@/components/auth/verify-otp-form";
import { Card } from "@/components/ui/card";

export default async function VerifyOtpPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { locale } = await params;
  const { email } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto max-w-sm px-4 py-14">
      <Card className="space-y-6 p-6">
        <h1 className="text-xl font-bold">{t("otpTitle")}</h1>
        <VerifyOtpForm email={email ?? ""} />
      </Card>
    </div>
  );
}
