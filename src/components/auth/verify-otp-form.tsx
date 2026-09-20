"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function VerifyOtpForm({ email }: { email: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      setError("Supabase isn't configured yet (see .env.example) — verification isn't live in this preview.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "signup",
    });

    setLoading(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function resend() {
    if (!isSupabaseConfigured) return;
    await createClient().auth.resend({ type: "signup", email });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("otpBody", { email })}</p>
      <div>
        <Label htmlFor="code">{t("otpCode")}</Label>
        <Input
          id="code"
          inputMode="numeric"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="animate-spin" size={16} />}
        {t("otpSubmit")}
      </Button>
      <button type="button" onClick={resend} className="w-full text-center text-sm text-primary-700 underline">
        {t("otpResend")}
      </button>
    </form>
  );
}
