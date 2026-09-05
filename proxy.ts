import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicRoutes = ["/", "/sign-in", "/sign-up", "/api/health"];
function isPublic(pathname: string) { return publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)); }

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone(); url.pathname = "/sign-in"; url.searchParams.set("next", pathname); return NextResponse.redirect(url);
  }
  // Do not redirect authenticated users away from sign-in/sign-up. This lets them switch accounts or create a second account intentionally.
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"] };
