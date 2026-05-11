'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PlanId, isPlanId, plans } from '@/lib/plans'
import BrandLink from '@/components/BrandLink'

export default function PricingPage() {
    const router = useRouter()
    const [userId, setUserId] = useState<string | null>(null)
    const [currentPlan, setCurrentPlan] = useState<PlanId>('free')
    const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null)

    useEffect(() => {
        async function loadPlan() {
            const { data } = await supabase.auth.getUser()
            const currentUser = data.user
            setUserId(currentUser?.id ?? null)

            if (!currentUser) return

            const { data: profile } = await supabase
                .from('profiles')
                .select('plan')
                .eq('id', currentUser.id)
                .single()

            if (isPlanId(profile?.plan)) {
                setCurrentPlan(profile.plan)
            }
        }

        loadPlan()
    }, [])

    async function choosePlan(plan: PlanId) {
        if (!userId) {
            router.push('/login?mode=signup')
            return
        }

        if (plan !== 'free') {
            router.push(`/checkout/${plan}`)
            return
        }

        setLoadingPlan(plan)

        const { error } = await supabase
            .from('profiles')
            .upsert({ id: userId, plan }, { onConflict: 'id' })

        if (!error) {
            setCurrentPlan(plan)
            router.push('/dashboard')
        }

        setLoadingPlan(null)
    }

    return (
        <main className="min-h-screen pt-[73px] bg-gradient-to-b from-gray-50 to-white text-black dark:from-zinc-950 dark:to-zinc-900 dark:text-white transition-colors duration-300">
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-3 border-b border-gray-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur">
                <BrandLink />

                <div className="flex items-center gap-6 text-sm">
                    <a href="/dashboard" className="hover:opacity-70 transition">
                        Dashboard
                    </a>
                    <a
                        href="/login"
                        className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-full hover:opacity-80 transition"
                    >
                        Log In
                    </a>
                </div>
            </nav>

            <section className="max-w-6xl mx-auto px-8 py-14">
                <div className="max-w-2xl">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Subscriptions
                    </p>
                    <h1 className="text-4xl font-semibold tracking-tight mt-3">
                        Pick the plan that matches your invoice volume.
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-4">
                        Start free, then unlock exports, deeper tracking, and team-ready billing tools as your workflow grows.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                    {plans.map((plan) => {
                        const isCurrentPlan = currentPlan === plan.id
                        const isFeatured = plan.id === 'plus'

                        return (
                            <article
                                key={plan.id}
                                className={`relative bg-white dark:bg-zinc-900 border rounded-2xl p-6 shadow-sm transition ${
                                    isFeatured
                                        ? 'border-black dark:border-white shadow-md'
                                        : 'border-gray-200 dark:border-zinc-800'
                                }`}
                            >
                                {plan.badge && (
                                    <div className="absolute right-5 top-5 bg-black text-white dark:bg-white dark:text-black text-xs font-semibold px-3 py-1 rounded-full">
                                        {plan.badge}
                                    </div>
                                )}

                                <div>
                                    <h2 className="text-xl font-semibold">
                                        {plan.name}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 min-h-10">
                                        {plan.description}
                                    </p>
                                </div>

                                <div className="mt-7 flex items-end gap-1">
                                    <span className="text-4xl font-semibold tracking-tight">
                                        {plan.price}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                        /month
                                    </span>
                                </div>

                                <button
                                    onClick={() => choosePlan(plan.id)}
                                    disabled={loadingPlan !== null || isCurrentPlan}
                                    className={`mt-7 w-full py-3 rounded-md font-medium transition ${
                                        isCurrentPlan
                                            ? 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400 cursor-not-allowed'
                                            : isFeatured
                                            ? 'bg-black text-white dark:bg-white dark:text-black hover:opacity-80'
                                            : 'border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                    }`}
                                >
                                    {isCurrentPlan
                                        ? 'Current plan'
                                        : loadingPlan === plan.id
                                        ? 'Updating...'
                                        : plan.id === 'free'
                                        ? 'Start free'
                                        : `Choose ${plan.name}`}
                                </button>

                                <div className="border-t border-gray-200 dark:border-zinc-800 mt-7 pt-6">
                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">
                                        Includes
                                    </p>
                                    <ul className="mt-4 space-y-3 text-sm">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-3">
                                                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-black dark:bg-zinc-800 dark:text-white">
                                                    ✓
                                                </span>
                                                <span className="text-gray-700 dark:text-gray-300">
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </article>
                        )
                    })}
                </div>
            </section>
        </main>
    )
}
