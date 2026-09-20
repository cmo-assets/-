"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { RatingStars } from "@/components/ui/rating-stars";
import { Button } from "@/components/ui/button";
import type { ReviewRow } from "@/lib/types/database";
import { Star } from "lucide-react";

export function ReviewsSection({
  pitchId,
  initialReviews,
  isLoggedIn,
}: {
  pitchId: string;
  initialReviews: (ReviewRow & { authorInitial: string })[];
  isLoggedIn: boolean;
}) {
  const t = useTranslations("pitch");
  const locale = useLocale();
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitReview() {
    if (!isSupabaseConfigured) return;
    setSubmitting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    const { data, error } = await supabase
      .from("reviews")
      .upsert({ pitch_id: pitchId, user_id: user.id, rating, comment })
      .select()
      .single();

    setSubmitting(false);
    if (!error && data) {
      setReviews((prev) => [{ ...data, authorInitial: "•" }, ...prev.filter((r) => r.id !== data.id)]);
      setComment("");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("reviews")}</h2>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noReviews")}</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between">
                <RatingStars rating={review.rating} />
                <time className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-SA", {
                    calendar: "gregory",
                  })}
                </time>
              </div>
              {review.comment && <p className="mt-2 text-sm">{review.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      {isLoggedIn && (
        <div className="space-y-2 rounded-xl border border-dashed border-border p-3">
          <p className="text-sm font-medium">{t("writeReview")}</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} aria-label={String(n)}>
                <Star
                  size={20}
                  className={n <= rating ? "fill-primary-500 text-primary-500" : "text-border"}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("commentPlaceholder")}
            rows={3}
            className="w-full rounded-xl border border-border p-2.5 text-sm outline-none focus:border-primary-400"
          />
          <Button size="sm" onClick={submitReview} disabled={submitting}>
            {t("submitReview")}
          </Button>
        </div>
      )}
    </div>
  );
}
