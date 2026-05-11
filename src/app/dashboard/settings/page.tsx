'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getPlan, isPlanId, PlanId } from '@/lib/plans'

export default function SettingsPage() {
    const [user, setUser] = useState<User | null>(null)
    const [plan, setPlan] = useState<PlanId>('free')
    const [fullName, setFullName] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    useEffect(() => {
        async function loadSettings() {
            const { data } = await supabase.auth.getUser()
            const currentUser = data.user
            setUser(currentUser)

            if (!currentUser) return

            setFullName(currentUser.user_metadata?.full_name ?? currentUser.user_metadata?.name ?? '')
            setCompanyName(currentUser.user_metadata?.company_name ?? '')

            const { data: profile } = await supabase
                .from('profiles')
                .select('plan')
                .eq('id', currentUser.id)
                .single()

            if (isPlanId(profile?.plan)) {
                setPlan(profile.plan)
            }
        }

        loadSettings()
    }, [])

    async function saveProfile() {
        setSaving(true)
        setMessage(null)

        const { error } = await supabase.auth.updateUser({
            data: {
                full_name: fullName,
                company_name: companyName,
            },
        })

        setSaving(false)
        setMessage(error ? 'Could not save profile settings.' : 'Profile settings saved.')
    }

    async function sendPasswordReset() {
        if (!user?.email) return

        await supabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: window.location.origin,
        })

        setMessage('Password reset email sent.')
    }

    const currentPlan = getPlan(plan)

    return (
        <main className="flex flex-col gap-8 px-8 pt-10 max-w-5xl mx-auto transition-colors duration-300">
            <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                    Settings
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Manage your account, billing, and invoice defaults.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold">Profile</h2>
                    <div className="grid grid-cols-1 gap-4 mt-6">
                        <input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="border px-4 py-3 rounded-md bg-white dark:bg-zinc-800 dark:text-white border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                            placeholder="Full name"
                        />
                        <input
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="border px-4 py-3 rounded-md bg-white dark:bg-zinc-800 dark:text-white border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                            placeholder="Company name"
                        />
                        <input
                            value={user?.email ?? ''}
                            disabled
                            className="border px-4 py-3 rounded-md bg-gray-50 dark:bg-zinc-800 text-gray-500 border-gray-300 dark:border-zinc-700"
                            placeholder="Email"
                        />
                    </div>
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={saveProfile}
                            disabled={saving}
                            className="bg-black text-white dark:bg-white dark:text-black px-5 py-2 rounded-full hover:opacity-80 transition disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Profile'}
                        </button>
                        <button
                            onClick={sendPasswordReset}
                            className="border border-gray-300 dark:border-zinc-700 px-5 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
                        >
                            Send Password Reset
                        </button>
                    </div>
                    {message && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                            {message}
                        </p>
                    )}
                </section>

                <aside className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm h-fit">
                    <h2 className="text-lg font-semibold">Billing</h2>
                    <div className="mt-5 flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Current plan</span>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300">
                            {currentPlan.name}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                        {currentPlan.description}
                    </p>
                    <a
                        href="/pricing"
                        className="inline-flex mt-6 bg-black text-white dark:bg-white dark:text-black px-5 py-2 rounded-full hover:opacity-80 transition"
                    >
                        Manage Plan
                    </a>
                </aside>
            </div>
        </main>
    )
}
