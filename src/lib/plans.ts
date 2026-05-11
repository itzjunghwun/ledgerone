export type PlanId = 'free' | 'plus' | 'pro'

export type Plan = {
    id: PlanId
    name: string
    price: string
    monthlyPrice: number
    stripeMonthlyPriceEnv: string | null
    stripeAnnualPriceEnv: string | null
    description: string
    invoiceLimit: number | null
    badge?: string
    features: string[]
}

export const plans: Plan[] = [
    {
        id: 'free',
        name: 'Free',
        price: '$0',
        monthlyPrice: 0,
        stripeMonthlyPriceEnv: null,
        stripeAnnualPriceEnv: null,
        description: 'For trying LedgerOne and sending a few invoices.',
        invoiceLimit: 3,
        features: [
            '3 active invoices',
            'Basic invoice tracking',
            'Paid and unpaid status updates',
            'Overdue invoice highlighting',
        ],
    },
    {
        id: 'plus',
        name: 'Plus',
        price: '$12',
        monthlyPrice: 12,
        stripeMonthlyPriceEnv: 'STRIPE_PLUS_MONTHLY_PRICE_ID',
        stripeAnnualPriceEnv: 'STRIPE_PLUS_ANNUAL_PRICE_ID',
        description: 'For freelancers who invoice every month.',
        invoiceLimit: 25,
        badge: 'Best value',
        features: [
            '25 active invoices',
            'CSV invoice export',
            'Client email history',
            'Payment status dashboard',
            'Priority email support',
        ],
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$29',
        monthlyPrice: 29,
        stripeMonthlyPriceEnv: 'STRIPE_PRO_MONTHLY_PRICE_ID',
        stripeAnnualPriceEnv: 'STRIPE_PRO_ANNUAL_PRICE_ID',
        description: 'For growing teams with heavier billing workflows.',
        invoiceLimit: null,
        features: [
            'Unlimited invoices',
            'Everything in Plus',
            'Smart overdue insights',
            'Client reminder actions',
            'Team-ready reporting',
        ],
    },
]

export function isPlanId(plan: string | null | undefined): plan is PlanId {
    return plan === 'free' || plan === 'plus' || plan === 'pro'
}

export function getPlan(plan: string | null | undefined): Plan {
    return plans.find((item) => item.id === plan) ?? plans[0]
}
