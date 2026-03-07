import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: "",
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value: "",
                        ...options,
                    });
                },
            },
        }
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Protect dashboard routes
    if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // Protect API routes
    if (!user && (request.nextUrl.pathname.startsWith("/api/generate-plan") || request.nextUrl.pathname.startsWith("/api/roxy-chat"))) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Invite code logic
    const inviteCode = request.cookies.get("fitmax_invite_code")?.value;
    const isInviteRoute = request.nextUrl.pathname.startsWith("/invite");
    const isApiRoute = request.nextUrl.pathname.startsWith("/api");
    const isStaticAsset = request.nextUrl.pathname.startsWith("/_next") || request.nextUrl.pathname.includes(".");

    if (!inviteCode && !isInviteRoute && !isApiRoute && !isStaticAsset) {
        const url = request.nextUrl.clone();
        url.pathname = "/invite";
        return NextResponse.redirect(url);
    }

    if (inviteCode === "r329hgk" && (request.nextUrl.pathname.startsWith("/dashboard/meals") || request.nextUrl.pathname.startsWith("/dashboard/chat"))) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard/home";
        url.searchParams.set("restricted", "true");
        return NextResponse.redirect(url);
    }

    // Redirect logged-in users away from login page
    if (user && request.nextUrl.pathname === "/login") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard/home";
        return NextResponse.redirect(url);
    }

    return response;
}
