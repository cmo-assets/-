import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  return updateSession(request, response ?? NextResponse.next());
}

export const config = {
  // /auth/* is Supabase's own email-confirmation callback route — it isn't
  // locale-prefixed and manages its own session exchange.
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
