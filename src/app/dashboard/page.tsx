import { auth } from "@/auth";
import { UTMBuilder } from "@/components/utm-builder";
import { AnalyticsCharts } from "@/components/analytics-charts";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await auth();

    if (!session) {
        redirect("/api/auth/signin?callbackUrl=/dashboard");
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Marketing Dashboard</h1>
                    <p className="text-slate-500">Create, manage, and track your marketing links.</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-600">
                        Welcome, {session.user?.name || session.user?.email}
                    </span>
                    {/* SignOut button could go here or in a nav bar */}
                </div>
            </div>

            <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Quick Shortcuts</h2>
                <UTMBuilder />
            </div>

            <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
                <AnalyticsCharts />
            </div>

            {/* 
        Future: Add "My Links" table here.
        <RecentLinks /> 
      */}
        </div>
    );
}
