import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Only these routes work without a session. Everything else bounces to /login.
const PUBLIC_PATHS = new Set(["/login", "/signup"]);

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname);
}

/** Cron uses CRON_SECRET (Bearer), not a browser session. */
function isCronPath(pathname: string) {
  return pathname === "/api/cron/dispatch-reminders" || pathname.startsWith("/api/cron/");
}

/**
 * Next.js 16 request gate (proxy = old middleware).
 * Refreshes the auth cookie, then either lets the request through or redirects.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let the cron route authenticate itself via CRON_SECRET.
  if (isCronPath(pathname)) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // Supabase may refresh tokens mid-request; write them onto both the
        // request (for downstream) and the response (for the browser).
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // getUser() hits Supabase and validates the JWT. getSession() only reads the
  // cookie and can be spoofed, so don't use it for access control.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const onPublicPath = isPublicPath(pathname);

  // Not signed in → login, keep ?next= so we can send them back after.
  if (!user && !onPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already signed in → no reason to sit on login/signup.
  if (user && onPublicPath) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  // Skip static assets; no need to run auth on every image request.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
