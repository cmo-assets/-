"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Landing point for Supabase's email confirmation link (and any future
 * magic-link/reset flows). This must run client-side: Supabase can deliver
 * the session either as a `?code=` query param (PKCE — exchanged
 * explicitly below) or as `#access_token=...` in the URL hash (implicit
 * flow). A hash fragment never reaches the server, so only the browser can
 * see it, and the SDK's built-in `detectSessionInUrl` parses it
 * asynchronously — `onAuthStateChange` (not an immediate `getSession()`
 * call, which races that parsing) is what tells us it's done.
 */
export default function AuthCallbackPage() {
  useEffect(() => {
    const supabase = createClient();
    const code = new URLSearchParams(window.location.search).get("code");

    function goHome() {
      // A hard navigation (not router.push) so the server re-reads the
      // freshly-written session cookie on the very next request.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/";
    }

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(goHome);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // Fires once detectSessionInUrl finishes parsing the hash fragment
      // into a real session — INITIAL_SESSION can fire earlier with no
      // session yet, so it isn't a reliable "done" signal on its own.
      if (event === "SIGNED_IN") {
        subscription.unsubscribe();
        goHome();
      }
    });

    // No hash session and no code — nothing to wait for.
    const fallback = setTimeout(goHome, 4000);
    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Signing you in…
    </div>
  );
}
