'use client'

import { useState, useEffect, useRef } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { getPlan, isPlanId, PlanId } from "@/lib/plans"
import { useRouter } from "next/navigation"

export default function AppNavbar() {
    const router = useRouter()
    
    const [dark, setDark] = useState(() =>
        typeof document !== "undefined"
            ? document.documentElement.classList.contains("dark")
            : false
    )
    const [open, setOpen] = useState(false)
    const [user, setUser] = useState<User | null>(null)
    const [plan, setPlan] = useState<PlanId>("free")
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        async function loadUser() {
            const { data } = await supabase.auth.getUser()
            const currentUser = data.user
            setUser(currentUser)

            if (!currentUser) return

            const { data: profile } = await supabase
                .from("profiles")
                .select("plan")
                .eq("id", currentUser.id)
                .single()

            if (isPlanId(profile?.plan)) {
                setPlan(profile.plan)
            }
        }

        loadUser()

        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null)
        })

        return () => {
            listener.subscription.unsubscribe()
        }
    }, [])

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    function toggleDarkMode() {
        const newMode = !dark
        setDark(newMode)
        document.documentElement.classList.toggle("dark", newMode)
    }

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push("/")
    }

    async function handlePasswordReset() {
        if (!user?.email) return

        await supabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: window.location.origin,
        })

        alert("Password reset email sent.")
        setOpen(false)
    }

    function contactSupport() {
        window.location.href =
            "mailto:support@ledgerone.app?subject=LedgerOne%20Support"
    }

    const displayName =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split("@")[0] ||
        "Account"
    const email = user?.email ?? "Signed in"
    const initial = displayName.charAt(0).toUpperCase()
    const currentPlan = getPlan(plan)

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-3 border-b border-gray-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur transition-colors duration-300">
            <button
                onClick={() => router.push("/dashboard")}
                className="font-semibold text-2xl"
            >
                LedgerOne
            </button> 

            <div className="flex items-center gap-6 text-sm relative" ref={menuRef}>
                <a href="/dashboard" className="hover:opacity-70 transition">
                    Dashboard
                </a>

                <a href="/dashboard/clients" className="hover:opacity-70 transition">
                    Clients
                </a>

                <a href="/pricing" className="hover:opacity-70 transition">
                    Pricing
                </a>

                <button
                    onClick={() => setOpen(!open)}
                    className="flex items-center gap-3 rounded-full border border-gray-200 dark:border-zinc-800 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-zinc-900 transition"
                    aria-expanded={open}
                    aria-label="Open profile menu"
                >
                    <span className="hidden sm:block max-w-32 truncate font-medium">
                        {displayName}
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black text-sm font-semibold">
                        {initial}
                    </span>
                </button>

                {open && (
                    <div className="absolute right-0 top-12 w-80 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg p-3 transition-colors duration-300 z-50">
                        <div className="px-3 py-3 border-b border-gray-200 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black text-sm font-semibold">
                                    {initial}
                                </span>
                                <div className="min-w-0">
                                    <p className="font-semibold truncate">
                                        {displayName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {email}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs">
                                <span className="text-gray-500 dark:text-gray-400">
                                    Subscription
                                </span>
                                <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300 font-medium">
                                    {currentPlan.name}
                                </span>
                            </div>
                        </div>

                        <div className="py-2">
                            <a
                                href="/pricing"
                                onClick={() => setOpen(false)}
                                className="w-full flex justify-between items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                            >
                                <span>Manage subscription</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {currentPlan.price}/mo
                                </span>
                            </a>

                            <button
                                onClick={handlePasswordReset}
                                className="w-full flex justify-between items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition text-left"
                            >
                                <span>Password reset</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Email
                                </span>
                            </button>

                            <a
                                href="/dashboard/settings"
                                onClick={() => setOpen(false)}
                                className="w-full flex justify-between items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                            >
                                <span>Account settings</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Profile
                                </span>
                            </a>

                            <button
                                onClick={contactSupport}
                                className="w-full flex justify-between items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition text-left"
                            >
                                <span>Support</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Contact
                                </span>
                            </button>
                        </div>

                        <div className="py-2 border-t border-gray-200 dark:border-zinc-800">
                            <button
                                onClick={toggleDarkMode}
                                className="w-full flex justify-between items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                            >
                                <span>Appearance</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {dark ? "Dark" : "Light"}
                                </span>
                            </button>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition text-left"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}
