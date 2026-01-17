import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch all links for the user
    const userLinks = await prisma.link.findMany({
        where: { creatorId: session.user.id },
        select: { id: true, alias: true, originalUrl: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
    });

    const linkIds = userLinks.map(l => l.id);

    // Aggregations
    // 1. Total Clicks
    const totalClicks = await prisma.click.count({
        where: { linkId: { in: linkIds } },
    });

    // 2. Clicks over time (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const clicksOverTime = await prisma.click.groupBy({
        by: ['timestamp'],
        where: {
            linkId: { in: linkIds },
            timestamp: { gte: sevenDaysAgo },
        },
        _count: { id: true },
    });

    // Normalize timestamp to date string (YYYY-MM-DD) for charting
    // This logic is better handled in DB with date_trunc but Prisma groupBy is limited.
    // We will do naive JS aggregation here for MVP or use raw query if perf needed.
    const dailyClicks: Record<string, number> = {};
    clicksOverTime.forEach(c => {
        const date = c.timestamp.toISOString().split('T')[0];
        dailyClicks[date] = (dailyClicks[date] || 0) + c._count.id;
    });

    const chartData = Object.entries(dailyClicks).map(([date, clicks]) => ({ date, clicks }));

    // 3. Top Referrers
    const referrers = await prisma.click.groupBy({
        by: ['referer'],
        where: { linkId: { in: linkIds } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
    });

    return NextResponse.json({
        summary: {
            totalLinks: userLinks.length,
            totalClicks,
        },
        chartData,
        topReferrers: referrers.map(r => ({ name: r.referer || 'Direct', value: r._count.id })),
        recentLinks: userLinks.slice(0, 5),
    });
}
