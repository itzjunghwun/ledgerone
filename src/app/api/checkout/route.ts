import { NextRequest, NextResponse } from 'next/server'
import { getPlan, isPlanId } from '@/lib/plans'

export async function POST(request: NextRequest) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY

    if (!stripeSecretKey) {
        return NextResponse.json(
            { error: 'Stripe is not configured.' },
            { status: 501 }
        )
    }

    const body = await request.json()
    const planId = isPlanId(body.plan) ? body.plan : null
    const billingCycle = body.billingCycle === 'annual' ? 'annual' : 'monthly'
    const userId = typeof body.userId === 'string' ? body.userId : ''
    const customerEmail = typeof body.customerEmail === 'string' ? body.customerEmail : undefined

    if (!planId || planId === 'free' || !userId) {
        return NextResponse.json(
            { error: 'Invalid checkout request.' },
            { status: 400 }
        )
    }

    const plan = getPlan(planId)
    const priceEnvName =
        billingCycle === 'annual'
            ? plan.stripeAnnualPriceEnv
            : plan.stripeMonthlyPriceEnv
    const priceId = priceEnvName ? process.env[priceEnvName] : null

    if (!priceId) {
        return NextResponse.json(
            { error: 'Stripe price is not configured.' },
            { status: 501 }
        )
    }

    const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? ''
    const params = new URLSearchParams()
    params.append('mode', 'subscription')
    params.append('line_items[0][price]', priceId)
    params.append('line_items[0][quantity]', '1')
    params.append('success_url', `${origin}/checkout/success?plan=${planId}&session_id={CHECKOUT_SESSION_ID}`)
    params.append('cancel_url', `${origin}/checkout/${planId}`)
    params.append('client_reference_id', userId)
    params.append('metadata[userId]', userId)
    params.append('metadata[plan]', planId)
    params.append('metadata[billingCycle]', billingCycle)
    params.append('subscription_data[metadata][userId]', userId)
    params.append('subscription_data[metadata][plan]', planId)

    if (customerEmail) {
        params.append('customer_email', customerEmail)
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
    })

    const session = await response.json()

    if (!response.ok || !session.url) {
        return NextResponse.json(
            { error: session.error?.message ?? 'Could not create Stripe checkout session.' },
            { status: 400 }
        )
    }

    return NextResponse.json({ url: session.url })
}
