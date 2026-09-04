import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16: "Proxy" is the renamed Middleware. Refreshes the Supabase session
// and guards authenticated routes.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (build assets)
     * - favicon, brand/font assets, and files with an extension
     */
    "/((?!_next/static|_next/image|favicon.ico|brand/|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|ttf|woff2?)$).*)",
  ],
};
