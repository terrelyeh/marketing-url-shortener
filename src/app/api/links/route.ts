import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { generateShortCode, isValidAliasFormat } from "@/lib/shortener";
import { NextResponse } from "next/server";
import { z } from "zod";

const createLinkSchema = z.object({
    originalUrl: z.string().url(),
    alias: z.string().optional(),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
    utmTerm: z.string().optional(),
    utmContent: z.string().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
});

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const json = await req.json();
        const body = createLinkSchema.parse(json);

        let alias = body.alias;

        // 1. Validate custom alias if provided
        if (alias) {
            const validation = isValidAliasFormat(alias);
            if (!validation.valid) {
                return new NextResponse(validation.error, { status: 400 });
            }

            // Check uniqueness
            const existing = await prisma.link.findUnique({ where: { alias } });
            if (existing) {
                return new NextResponse("Alias already exists", { status: 409 });
            }
        } else {
            // 2. Generate random alias (retry loop for collision)
            let retries = 0;
            while (retries < 5) {
                const code = generateShortCode();
                const existing = await prisma.link.findUnique({ where: { alias: code } });
                if (!existing) {
                    alias = code;
                    break;
                }
                retries++;
            }

            if (!alias) return new NextResponse("Failed to generate unique alias", { status: 500 });
        }

        // 3. Create Link
        // We construct the full original URL with UTM params if needed, or store them separately.
        // The schema supports storing them separately which is better for analytics breakdown later.
        // BUT we should also append them to the originalUrl if we want the redirect to carry them automatically?
        // Actually, usually headers/redirect should append them, OR we append them to the stored originalUrl.
        // Let's append them to a final destination URL for the redirect logic to use, or store in `originalUrl` directly?
        // The PRD says "UTM Builder... automatically combine into long URL".
        // So if the user uses the builder, the `originalUrl` sent here might already have params?
        // Let's assume the frontend constructs the final long URL, OR we do it here.
        // Storing separate fields is good for "Template" re-use or analysis.

        // Construct final URL with UTMs if they are not already in it.
        const urlObj = new URL(body.originalUrl);
        if (body.utmSource) urlObj.searchParams.set("utm_source", body.utmSource);
        if (body.utmMedium) urlObj.searchParams.set("utm_medium", body.utmMedium);
        if (body.utmCampaign) urlObj.searchParams.set("utm_campaign", body.utmCampaign);
        if (body.utmTerm) urlObj.searchParams.set("utm_term", body.utmTerm);
        if (body.utmContent) urlObj.searchParams.set("utm_content", body.utmContent);

        const finalUrl = urlObj.toString();

        const link = await prisma.link.create({
            data: {
                alias: alias!,
                originalUrl: finalUrl,
                creatorId: session.user.id,
                utmSource: body.utmSource,
                utmMedium: body.utmMedium,
                utmCampaign: body.utmCampaign,
                utmTerm: body.utmTerm,
                utmContent: body.utmContent,
                expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
            },
        });

        return NextResponse.json(link);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 });
        }
        return new NextResponse(null, { status: 500 });
    }
}
