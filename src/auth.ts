import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
    ],
    callbacks: {
        async signIn({ user }) {
            // Restrict to @company.com emails if needed
            // const isAllowedToSignIn = user.email?.endsWith("@company.com")
            // if (isAllowedToSignIn) return true
            // return false
            return true
        },
        async session({ session, user }) {
            // Add role to session
            if (session.user && user) {
                // Fetch fresh user for role if needed, or rely on adapter
                // Note: with Database session, properties might be on 'user' object in session callback
            }
            return session
        }
    },
    pages: {
        signIn: '/auth/signin',
    },
})
