'use client'

import AppNavbar from "@/components/AppNavbar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex flex-col transition-colors duration-300">
            <AppNavbar />
            <div className="flex-1 pt-[73px] bg-gradient-to-b from-gray-50 to-white dark:from-zinc-950 dark:to-zinc-900">
                <main className="max-w-6xl mx-auto px-8 py-10">
                    {children}
                </main>
            </div>
        </div>
    )
}
