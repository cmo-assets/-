/**
 * Tap Payments integration stub for deposit charges (mada / Apple Pay).
 * Wire up `TAP_SECRET_KEY` and swap the simulated branch for a real call to
 * https://api.tap.company/v2/charges once a live Tap account is available.
 */
export async function chargeDeposit({
  amountSar,
  bookingId,
  customerEmail,
}: {
  amountSar: number;
  bookingId: string;
  customerEmail: string;
}): Promise<{ status: "paid" | "failed"; providerChargeId: string }> {
  const secretKey = process.env.TAP_SECRET_KEY;

  if (!secretKey) {
    // No live Tap account configured — simulate an immediate successful
    // charge so the booking flow can be demoed end to end.
    return { status: "paid", providerChargeId: `demo_${bookingId}` };
  }

  const response = await fetch("https://api.tap.company/v2/charges", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountSar,
      currency: "SAR",
      customer: { email: customerEmail },
      source: { id: "src_all" },
      description: `Mala3bak deposit — booking ${bookingId}`,
      metadata: { bookingId },
    }),
  });

  const data = await response.json();
  return {
    status: data.status === "CAPTURED" ? "paid" : "failed",
    providerChargeId: data.id,
  };
}
