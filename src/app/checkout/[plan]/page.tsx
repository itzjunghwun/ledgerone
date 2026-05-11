'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getPlan, isPlanId } from '@/lib/plans'
import BrandLink from '@/components/BrandLink'

type BillingCycle = 'monthly' | 'annual'

function formatCurrency(amount: number) {
    return amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    })
}

export default function CheckoutPage() {
    const router = useRouter()
    const params = useParams<{ plan: string }>()
    const planId = isPlanId(params.plan) ? params.plan : null
    const selectedPlan = getPlan(planId)
    const [userId, setUserId] = useState<string | null>(null)
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
    const [cardName, setCardName] = useState('')
    const [cardNumber, setCardNumber] = useState('')
    const [expiry, setExpiry] = useState('')
    const [cvc, setCvc] = useState('')
    const [zip, setZip] = useState('')
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadUser() {
            const { data } = await supabase.auth.getUser()

            if (!data.user) {
                router.push('/login?mode=signup')
                return
            }

            setUserId(data.user.id)
            setUserEmail(data.user.email ?? null)
        }

        loadUser()
    }, [router])

    const isPaidPlan = planId === 'plus' || planId === 'pro'
    const yearlyTotal = selectedPlan.monthlyPrice * 10
    const dueToday = billingCycle === 'annual'
        ? yearlyTotal
        : selectedPlan.monthlyPrice
    const monthlyEquivalent = billingCycle === 'annual'
        ? Math.round(yearlyTotal / 12)
        : selectedPlan.monthlyPrice

    const canSubmit = useMemo(() => {
        return Boolean(
            userId &&
            isPaidPlan &&
            cardName.trim() &&
            cardNumber.replace(/\s/g, '').length >= 12 &&
            expiry.trim().length >= 4 &&
            cvc.trim().length >= 3 &&
            zip.trim().length >= 5
        )
    }, [cardName, cardNumber, cvc, expiry, isPaidPlan, userId, zip])

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)

        if (!planId || !isPaidPlan) {
            router.push('/pricing')
            return
        }

        if (!canSubmit || !userId) {
            setError('Please complete all billing fields.')
            return
        }

        setProcessing(true)

        const checkoutResponse = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                plan: planId,
                billingCycle,
                userId,
                customerEmail: userEmail,
            }),
        })

        if (checkoutResponse.ok) {
            const checkout = await checkoutResponse.json()

            if (checkout.url) {
                window.location.href = checkout.url
                return
            }
        }

        if (checkoutResponse.status !== 501) {
            const checkout = await checkoutResponse.json()
            setError(checkout.error ?? 'Could not start checkout. Please try again.')
            setProcessing(false)
            return
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({ id: userId, plan: planId }, { onConflict: 'id' })

        if (updateError) {
            setError('We could not update your subscription. Please try again.')
            setProcessing(false)
            return
        }

        router.push(`/checkout/success?plan=${planId}`)
    }

    if (!planId || planId === 'free') {
        return (
            <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-zinc-950 dark:to-zinc-900 text-black dark:text-white px-8 py-12">
                <div className="max-w-xl mx-auto bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-8 shadow-sm">
                    <h1 className="text-2xl font-semibold">Choose a paid plan</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-3">
                        Checkout is available for Plus and Pro subscriptions.
                    </p>
                    <Link
                        href="/pricing"
                        className="inline-flex mt-6 bg-black text-white dark:bg-white dark:text-black px-5 py-2 rounded-full hover:opacity-80 transition"
                    >
                        Back to pricing
                    </Link>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen pt-[73px] bg-gradient-to-b from-gray-50 to-white dark:from-zinc-950 dark:to-zinc-900 text-black dark:text-white transition-colors duration-300">
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-3 border-b border-gray-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur">
                <BrandLink />
                <Link href="/pricing" className="text-sm hover:opacity-70 transition">
                    Pricing
                </Link>
            </nav>

            <section className="max-w-6xl mx-auto px-8 py-12">
                <div className="max-w-2xl">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Checkout
                    </p>
                    <h1 className="text-4xl font-semibold tracking-tight mt-3">
                        Start your {selectedPlan.name} subscription.
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-4">
                        Pay securely with Stripe when configured. Until then, this page can activate a test subscription for local development.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-10">
                    <form
                        onSubmit={handleSubmit}
                        className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-lg font-semibold">Payment Details</h2>
                            <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-300">
                                Test checkout
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-6 bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setBillingCycle('monthly')}
                                className={`py-2 rounded-md text-sm font-medium transition ${
                                    billingCycle === 'monthly'
                                        ? 'bg-white dark:bg-zinc-950 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                Monthly
                            </button>
                            <button
                                type="button"
                                onClick={() => setBillingCycle('annual')}
                                className={`py-2 rounded-md text-sm font-medium transition ${
                                    billingCycle === 'annual'
                                        ? 'bg-white dark:bg-zinc-950 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                Annual
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 mt-6">
                            <input
                                value={cardName}
                                onChange={(event) => setCardName(event.target.value)}
                                className="border px-4 py-3 rounded-md bg-white dark:bg-zinc-800 dark:text-white border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                                placeholder="Name on card"
                            />
                            <input
                                value={cardNumber}
                                onChange={(event) => setCardNumber(event.target.value)}
                                className="border px-4 py-3 rounded-md bg-white dark:bg-zinc-800 dark:text-white border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                                placeholder="Card number"
                                inputMode="numeric"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <input
                                    value={expiry}
                                    onChange={(event) => setExpiry(event.target.value)}
                                    className="border px-4 py-3 rounded-md bg-white dark:bg-zinc-800 dark:text-white border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                                    placeholder="MM / YY"
                                />
                                <input
                                    value={cvc}
                                    onChange={(event) => setCvc(event.target.value)}
                                    className="border px-4 py-3 rounded-md bg-white dark:bg-zinc-800 dark:text-white border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                                    placeholder="CVC"
                                    inputMode="numeric"
                                />
                                <input
                                    value={zip}
                                    onChange={(event) => setZip(event.target.value)}
                                    className="border px-4 py-3 rounded-md bg-white dark:bg-zinc-800 dark:text-white border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                                    placeholder="ZIP"
                                    inputMode="numeric"
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-red-600 mt-4">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={!canSubmit || processing}
                            className={`mt-6 w-full py-3 rounded-md font-medium transition ${
                                !canSubmit || processing
                                    ? 'bg-gray-200 text-gray-500 dark:bg-zinc-800 dark:text-gray-400 cursor-not-allowed'
                                    : 'bg-black text-white dark:bg-white dark:text-black hover:opacity-80'
                            }`}
                        >
                            {processing
                                ? 'Processing...'
                                : `Pay ${formatCurrency(dueToday)} and subscribe`}
                        </button>
                    </form>

                    <aside className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm h-fit">
                        <h2 className="text-lg font-semibold">Order Summary</h2>
                        <div className="mt-6 flex items-start justify-between gap-4">
                            <div>
                                <p className="font-semibold">{selectedPlan.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {selectedPlan.description}
                                </p>
                            </div>
                            <p className="font-semibold">{formatCurrency(monthlyEquivalent)}/mo</p>
                        </div>

                        <div className="border-t border-gray-200 dark:border-zinc-800 mt-6 pt-6 space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Billing</span>
                                <span>{billingCycle === 'annual' ? 'Annual' : 'Monthly'}</span>
                            </div>
                            {billingCycle === 'annual' && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Savings</span>
                                    <span>2 months free</span>
                                </div>
                            )}
                            <div className="flex justify-between text-base font-semibold pt-3">
                                <span>Due today</span>
                                <span>{formatCurrency(dueToday)}</span>
                            </div>
                        </div>

                        <ul className="border-t border-gray-200 dark:border-zinc-800 mt-6 pt-6 space-y-3 text-sm">
                            {selectedPlan.features.map((feature) => (
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
                    </aside>
                </div>
            </section>
        </main>
    )
}
