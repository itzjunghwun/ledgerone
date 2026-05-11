'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getPlan } from '@/lib/plans'

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={null}>
            <CheckoutSuccessContent />
        </Suspense>
    )
}

function CheckoutSuccessContent() {
    const searchParams = useSearchParams()
    const plan = getPlan(searchParams.get('plan'))

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-zinc-950 dark:to-zinc-900 text-black dark:text-white flex items-center justify-center px-8">
            <section className="max-w-xl w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-8 shadow-sm text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black font-semibold">
                    ✓
                </div>
                <h1 className="text-3xl font-semibold tracking-tight mt-6">
                    You are on {plan.name}.
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-3">
                    Your subscription is active in LedgerOne and your dashboard limits have been updated.
                </p>
                <div className="flex justify-center gap-3 mt-8">
                    <Link
                        href="/dashboard"
                        className="bg-black text-white dark:bg-white dark:text-black px-5 py-2 rounded-full hover:opacity-80 transition"
                    >
                        Go to Dashboard
                    </Link>
                    <Link
                        href="/pricing"
                        className="border border-gray-300 dark:border-zinc-700 px-5 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
                    >
                        View Plans
                    </Link>
                </div>
            </section>
        </main>
    )
}
