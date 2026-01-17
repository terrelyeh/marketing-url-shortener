import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

interface PageProps {
    params: Promise<{
        alias: string;
    }>;
}

export default async function RedirectPage({ params }: PageProps) {
    const { alias } = await params;

    // 1. Look up the link
    const link = await prisma.link.findUnique({
        where: { alias },
    });

    // 2. If not found, show 404
    if (!link) {
        notFound();
    }

    // 3. Track the click asynchronously (fire and forget)
    // Note: In Server Components, we should be careful with async side effects without awaiting.
    // Ideally, use `waitUntil` from Vercel Functions or just await it if consistency > speed.
    // For V1 "Internal" use, awaiting is safer to ensure data capture.
    // For high scale, move this to a background queue.
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || 'unknown';
    const referer = headersList.get('referer');
    // IP logging is tricky in Node/Next, usually X-Forwarded-For
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0] : 'unknown';

    // We await here for simplicity in MVP. 
    // Optimization: use `void trackClick(...)` but Next.js might kill the request context too early.
    // In Next.js 15, `after` is experimental/coming for this exact use case.
    await prisma.click.create({
        data: {
            linkId: link.id,
            userAgent,
            referer,
            country: 'Unknown', // GeoIP lookup would go here
            city: 'Unknown',
            // ipHash would handle anonymization
        },
    });

    // 4. Redirect
    // Default to 302 (Found) for temporary, 301 (Moved Permanently) if confirmed static.
    // Most shorteners use 301 for SEO link juice, but 302 allows tracking statistics accurately.
    // (Browsers cache 301 excessively, skipping our server and killing stats).
    // So we use 302 or 307.
    redirect(link.originalUrl);
}
