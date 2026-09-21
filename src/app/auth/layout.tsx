import "../globals.css";

/**
 * Independent root layout for the /auth/* tree (currently just the email
 * confirmation callback). It's a sibling of [locale]/, not nested under
 * it — Supabase's redirect target doesn't know the user's locale yet, so
 * this route needs its own minimal <html>/<body>, separate from the
 * locale-aware one in [locale]/layout.tsx.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
