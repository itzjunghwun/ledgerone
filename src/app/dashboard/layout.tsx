'use client'

import AppNavbar from "@/components/AppNavbar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen transition-colors duration-300">
            <AppNavbar />
            <main className="px-12 py-10">
                {children}
            </main>
        </div>
    )
}