import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isPlanId } from '@/lib/plans'

function verifyStripeSignature(payload: string, signature: string, secret: string) {
    const timestamp = signature
        .split(',')
        .find((part) => part.startsWith('t='))
        ?.slice(2)
    const expected = signature
        .split(',')
        .find((part) => part.startsWith('v1='))
        ?.slice(3)

    if (!timestamp || !expected) return false

    const signedPayload = `${timestamp}.${payload}`
    const digest = crypto
        .createHmac('sha256', secret)
        .update(signedPayload)
        .digest('hex')

    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(expected))
}

export async function POST(request: NextRequest) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!webhookSecret || !supabaseUrl || !serviceRoleKey) {
        return NextResponse.json(
            { error: 'Webhook is not configured.' },
            { status: 501 }
        )
    }

    const signature = request.headers.get('stripe-signature')
    const payload = await request.text()

    if (!signature || !verifyStripeSignature(payload, signature, webhookSecret)) {
        return NextResponse.json(
            { error: 'Invalid signature.' },
            { status: 400 }
        )
    }

    const event = JSON.parse(payload)

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object
        const userId = session.metadata?.userId ?? session.client_reference_id
        const plan = session.metadata?.plan

        if (typeof userId === 'string' && isPlanId(plan) && plan !== 'free') {
            const admin = createClient(supabaseUrl, serviceRoleKey)

            await admin
                .from('profiles')
                .upsert({ id: userId, plan }, { onConflict: 'id' })
        }
    }

    return NextResponse.json({ received: true })
}
