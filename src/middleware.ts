import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define protected routes
const PROTECTED_ROUTES = ["/dashboard", "/admin"]

// Reserved aliases that shouldn't process as short links
const RESERVED_ALIASES = ["api", "auth", "static", "favicon.ico", "dashboard"]

export default auth((req) => {
    const { nextUrl } = req
    const isLoggedIn = !!req.auth
    const isProtectedRoute = PROTECTED_ROUTES.some((route) => nextUrl.pathname.startsWith(route))

    // 1. Handle Protected Routes
    if (isProtectedRoute && !isLoggedIn) {
        return Response.redirect(new URL("/api/auth/signin", nextUrl))
    }

    // 2. Handle Short URL Redirection (Root level paths)
    // Logic: If path is root level (e.g. /xyz) and NOT reserved, treat as short link
    // Note: Actual redirection logic usually involves checking DB/Cache.
    // For middleware, we can check pattern. DB lookups in middleware are generally limited (Edge runtime)
    // unless we use specific adapters or fetch API.
    // For V1, we might do the look up in the page component `app/[alias]/page.tsx` for simplicity
    // OR use Edge Middleware if using a supported Edge DB or API.
    // Given we are using standard Postgres without Edge Adapter documented yet, 
    // we will pass through to the `[alias]` page handler for the actual DB lookup and redirect.
    // This avoids "Edge Runtime" limitations with standard Prisma Client.

    return NextResponse.next()
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}
