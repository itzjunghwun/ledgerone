'use client'

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function AppNavbar() {
    const router = useRouter()
    
    const [dark, setDark] = useState(false)
    const [open, setOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Sync state on mount
    useEffect(() => {
        const isDark = document.documentElement.classList.contains("dark")
        setDark(isDark)
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

    return (
        <nav className="flex items-center justify-between px-10 py-3 border-b transition-colors duration-300">
            <div className="font-semibold text-xl tracking-tight">
                LedgerOne
            </div> 

            <div className="flex items-center gap-6 text-sm relative" ref={menuRef}>
                <a href="/dashboard" className="hover:opacity-70 transition">
                    Dashboard
                </a>

                {/* Settings Button*/}
                <button
                    onClick={() => setOpen(!open)}
                    className="hover:opacity-70 transition"
                >
                    Settings
                </button>

                {/* Dropdown */}
                    {open && (
                        <div className="absolute right-0 top-8 w-48 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg p-4 transition-colors duration-300">
                            <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                                Appearance
                            </div>

                            <button
                                onClick={toggleDarkMode}
                                className="w-full flex justify-between items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                            >
                                <span>{dark ? "Dark Mode" : "Light Mode"}</span>
                                <span className="text-xs opacity-60">
                                    {dark ? "On" : "Off"}
                                </span>
                            </button>
                        </div>
                    )}   

                <button 
                    onClick={handleLogout}
                    className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-full transition hover:opacity-80"
                >
                    Logout
                </button>
            </div>
        </nav>
    )
}
