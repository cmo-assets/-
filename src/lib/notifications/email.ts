/**
 * Booking confirmation email stub. Wire up a transactional provider
 * (Resend, SendGrid, ...) here — Supabase Auth already handles the OTP
 * verification email separately.
 */
export async function sendBookingConfirmationEmail(params: {
  to: string;
  pitchName: string;
  venueName: string;
  startsAt: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.info("[email:booking-confirmation] (demo, not sent)", params);
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "ملاعبك <bookings@mala3bak.sa>",
      to: params.to,
      subject: "تأكيد الحجز — ملاعبك",
      html: `<p>تم تأكيد حجزك في ${params.pitchName} - ${params.venueName} بتاريخ ${params.startsAt}.</p>`,
    }),
  });
}
