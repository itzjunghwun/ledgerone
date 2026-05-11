'use client'

import { useState, useEffect} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { PlanId, getPlan, isPlanId } from '@/lib/plans'

type Invoice = {
    id: string
    clientName: string
    email: string
    amount: number 
    dueDate: string
    status: 'paid' | 'unpaid'
}

type InvoiceStatusFilter = 'all' | 'paid' | 'unpaid' | 'overdue'
type InvoiceDraft = {
    clientName: string
    email: string
    amount: string
    dueDate: string
    status: 'paid' | 'unpaid'
}

function isInvoiceOverdue(invoice: Invoice) {
    const today = new Date()
    const due = new Date(invoice.dueDate)

    today.setHours(0, 0, 0, 0)

    return invoice.status === 'unpaid' && due < today
}

function formatCurrency(amount: number) {
    return amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    })
}

export default function Dashboard() { // Dashboard component
    const [user, setUser] = useState<User | null>(null)
    const [clientName, setClientName] = useState('')
    const [email, setEmail] = useState('')
    const [amount, setAmount] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [plan, setPlan] = useState<PlanId>('free')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('all')
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [invoiceDraft, setInvoiceDraft] = useState<InvoiceDraft | null>(null)

    async function fetchInvoicesForUser(userId: string) { // Fetch invoices from Supabase
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) return 

        const formatted = data.map((invoice) => ({ // Format the fetched invoices
            id: invoice.id,
            clientName:invoice.client_name,
            email: invoice.email,
            amount: invoice.amount,
            dueDate: invoice.due_date,
            status: invoice.status.replace(/'/g, '') as 'paid' | 'unpaid',
        }))

        setInvoices(formatted) // Update the state with the fetched invoices
    }

    useEffect(() => { // Fetch user on mount
        async function initialize() {
            const { data } = await supabase.auth.getUser() // Fetch user data
            const currentUser = data.user
            setUser(currentUser)
            
            if (!currentUser) return 

            // check if profile exists
            const { data: profile } = await supabase
                .from('profiles')
                .select('plan')
                .eq('id', currentUser.id)
                .single()

            if (!profile) {
                await supabase.from('profiles').insert([
                    { id: currentUser.id, plan: 'free' }
                ])
                setPlan('free')
            } else if (isPlanId(profile.plan)) {
                setPlan(profile.plan)
            } else {
                setPlan('free')
            }

            await fetchInvoicesForUser(currentUser.id)
        }

        initialize()

        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null) // Update user state on auth state change

            if (session?.user) {
                void fetchInvoicesForUser(session.user.id)
            } else {
                setInvoices([])
            }
        })

        return () => {
            listener.subscription.unsubscribe() // Cleanup subscription on unmount
        }
    }, [])

    async function fetchInvoices() {
        if (!user) return

        await fetchInvoicesForUser(user.id)
    }

    async function addInvoice() { // Add a new invoice
        const currentPlan = getPlan(plan)

        if (
            currentPlan.invoiceLimit !== null &&
            invoices.length >= currentPlan.invoiceLimit
        ) {
            alert(`You have used all ${currentPlan.invoiceLimit} invoices on ${currentPlan.name}. Upgrade to add more invoices.`)
            return
        }

        if (!clientName.trim()) {
            alert('Client full name is required.')
            return
        }

        if (!email || ! amount || !dueDate || !user) {
            alert('Please fill in all fields.')
            return
        }

        await supabase.from('invoices').insert([ // Insert a new invoice
        {
            client_name: clientName, // Client name
            email: email, // Client email
            amount: Number(amount), // Convert amount to number
            due_date: dueDate, // Convert dueDate to string
            user_id: user.id, // Associate invoice with user
        },
    ])

    fetchInvoices()
    setEmail('')
    setAmount('')
    setDueDate('')
    setClientName('')
    }

    async function deleteInvoice(id: string) { // Delete an invoice
        await supabase.from('invoices').delete().eq('id', id) // .eq('id', id) -> WHERE id = ?
        fetchInvoices()
    }

    function openInvoice(invoice: Invoice) {
        setSelectedInvoice(invoice)
        setInvoiceDraft({
            clientName: invoice.clientName,
            email: invoice.email,
            amount: invoice.amount.toString(),
            dueDate: invoice.dueDate,
            status: invoice.status,
        })
    }

    function closeInvoice() {
        setSelectedInvoice(null)
        setInvoiceDraft(null)
    }

    async function updateInvoice() {
        if (!selectedInvoice || !invoiceDraft) return

        if (
            !invoiceDraft.clientName.trim() ||
            !invoiceDraft.email.trim() ||
            !invoiceDraft.amount ||
            !invoiceDraft.dueDate
        ) {
            alert('Please fill in all invoice fields.')
            return
        }

        await supabase
            .from('invoices')
            .update({
                client_name: invoiceDraft.clientName,
                email: invoiceDraft.email,
                amount: Number(invoiceDraft.amount),
                due_date: invoiceDraft.dueDate,
                status: invoiceDraft.status,
            })
            .eq('id', selectedInvoice.id)

        await fetchInvoices()
        closeInvoice()
    }

    async function toggleStatus(id: string, currentStatus: string) { // Toggle invoice status
        const newStatus = currentStatus === 'unpaid' ? 'paid' : 'unpaid'
    
        await supabase
            .from('invoices')
            .update({ status: newStatus })
            .eq('id', id)
        fetchInvoices()
    }

    function exportInvoices() {
        if (plan === 'free') {
            alert('CSV export is available on Plus and Pro.')
            return
        }

        const csvRows = [
            ['Client', 'Email', 'Amount', 'Due Date', 'Status'],
            ...invoices.map((invoice) => [
                invoice.clientName,
                invoice.email,
                invoice.amount.toString(),
                invoice.dueDate,
                invoice.status,
            ]),
        ]

        const csv = csvRows
            .map((row) =>
                row
                    .map((value) => `"${value.replace(/"/g, '""')}"`)
                    .join(',')
            )
            .join('\n')

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'ledgerone-invoices.csv'
        link.click()
        URL.revokeObjectURL(url)
    }

    function showPaywall(feature: string, requiredPlan: 'Plus' | 'Pro') {
        alert(`${feature} is available on ${requiredPlan}. Upgrade to unlock it.`)
    }

    function contactSupport() {
        if (plan === 'free') {
            showPaywall('Priority email support', 'Plus')
            return
        }

        window.location.href =
            'mailto:support@ledgerone.app?subject=LedgerOne%20Priority%20Support'
    }

    function sendReminder(invoice: Invoice) {
        if (plan !== 'pro') {
            showPaywall('Client reminder actions', 'Pro')
            return
        }

        const subject = encodeURIComponent(`Reminder for invoice due ${invoice.dueDate}`)
        const body = encodeURIComponent(
            `Hi ${invoice.clientName},\n\nThis is a friendly reminder that your invoice for ${formatCurrency(invoice.amount)} is still unpaid and was due on ${invoice.dueDate}.\n\nThank you.`
        )

        window.location.href = `mailto:${invoice.email}?subject=${subject}&body=${body}`
    }

    function printInvoice(invoice: Invoice) {
        const printWindow = window.open('', '_blank')

        if (!printWindow) return

        printWindow.document.write(`
            <html>
                <head>
                    <title>Invoice - ${invoice.clientName}</title>
                    <style>
                        body { font-family: Arial, sans-serif; color: #111; padding: 48px; }
                        .header { display: flex; justify-content: space-between; border-bottom: 1px solid #ddd; padding-bottom: 24px; }
                        .brand { font-size: 28px; font-weight: 700; }
                        .status { text-transform: uppercase; font-size: 12px; letter-spacing: 0.08em; }
                        .section { margin-top: 32px; }
                        .label { color: #667085; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
                        .value { font-size: 18px; margin-top: 6px; }
                        .amount { font-size: 40px; font-weight: 700; margin-top: 8px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <div class="brand">LedgerOne</div>
                            <p>Invoice for ${invoice.clientName}</p>
                        </div>
                        <div class="status">${invoice.status}</div>
                    </div>
                    <div class="section">
                        <div class="label">Bill To</div>
                        <div class="value">${invoice.clientName}</div>
                        <div>${invoice.email}</div>
                    </div>
                    <div class="section">
                        <div class="label">Amount Due</div>
                        <div class="amount">${formatCurrency(invoice.amount)}</div>
                    </div>
                    <div class="section">
                        <div class="label">Due Date</div>
                        <div class="value">${invoice.dueDate}</div>
                    </div>
                </body>
            </html>
        `)
        printWindow.document.close()
        printWindow.print()
    }

    if (!user) return null

    const currentPlan = getPlan(plan)
    const invoiceLimitText =
        currentPlan.invoiceLimit === null
            ? 'Unlimited invoices'
            : `${invoices.length}/${currentPlan.invoiceLimit} invoices used`
    const isAtInvoiceLimit =
        currentPlan.invoiceLimit !== null &&
        invoices.length >= currentPlan.invoiceLimit
    const hasPlusAccess = plan === 'plus' || plan === 'pro'
    const hasProAccess = plan === 'pro'
    const paidInvoices = invoices.filter((invoice) => invoice.status === 'paid')
    const unpaidInvoices = invoices.filter((invoice) => invoice.status === 'unpaid')
    const overdueInvoices = invoices.filter(isInvoiceOverdue)
    const dueSoonInvoices = unpaidInvoices.filter((invoice) => {
        const due = new Date(invoice.dueDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const diffInDays = Math.ceil(
            (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        return diffInDays >= 0 && diffInDays <= 7
    })
    const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0)
    const outstandingRevenue = unpaidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0)
    const overdueRevenue = overdueInvoices.reduce((sum, invoice) => sum + invoice.amount, 0)
    const totalInvoiceValue = invoices.reduce((sum, invoice) => sum + invoice.amount, 0)
    const paymentRate =
        invoices.length === 0
            ? 0
            : Math.round((paidInvoices.length / invoices.length) * 100)
    const averageInvoiceValue =
        invoices.length === 0 ? 0 : Math.round(totalInvoiceValue / invoices.length)
    const clientHistory = Array.from(
        invoices.reduce((clients, invoice) => {
            const key = invoice.email.toLowerCase()
            const existing = clients.get(key) ?? {
                name: invoice.clientName,
                email: invoice.email,
                total: 0,
                paid: 0,
                unpaid: 0,
                lastDueDate: invoice.dueDate,
            }

            existing.total += 1
            existing.paid += invoice.status === 'paid' ? 1 : 0
            existing.unpaid += invoice.status === 'unpaid' ? 1 : 0

            if (new Date(invoice.dueDate) > new Date(existing.lastDueDate)) {
                existing.lastDueDate = invoice.dueDate
            }

            clients.set(key, existing)
            return clients
        }, new Map<string, {
            name: string
            email: string
            total: number
            paid: number
            unpaid: number
            lastDueDate: string
        }>())
        .values()
    )
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
    const topClient = clientHistory[0]
    const oldestOverdue = [...overdueInvoices].sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )[0]
    const filteredInvoices = invoices.filter((invoice) => {
        const query = search.trim().toLowerCase()
        const matchesSearch =
            !query ||
            invoice.clientName.toLowerCase().includes(query) ||
            invoice.email.toLowerCase().includes(query) ||
            invoice.amount.toString().includes(query)

        const matchesStatus =
            statusFilter === 'all' ||
            invoice.status === statusFilter ||
            (statusFilter === 'overdue' && isInvoiceOverdue(invoice))

        return matchesSearch && matchesStatus
    })

    return (
        <main className="flex flex-col gap-8 px-8 pt-10 max-w-7xl mx-auto transition-colors duration-300">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between w-full">
            <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                    Dashboard
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Manage and track your invoices.
                </p>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={exportInvoices}
                    className={`text-sm px-5 py-2 rounded-full transition ${
                        plan === 'free'
                            ? 'border border-gray-300 text-gray-500 dark:border-zinc-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                            : 'bg-black text-white dark:bg-white dark:text-black hover:opacity-80'
                    }`}
                >
                    Export CSV
                </button>
                {hasPlusAccess && (
                    <button
                        onClick={contactSupport}
                        className="text-sm border border-gray-300 dark:border-zinc-700 px-5 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
                    >
                        Support
                    </button>
                )}
            </div>
        </div>

        <div className={`bg-white dark:bg-zinc-900 border rounded-xl px-6 py-4 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between ${
            isAtInvoiceLimit
                ? 'border-black dark:border-white'
                : 'border-gray-200 dark:border-zinc-800'
        }`}>
            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Current Plan
                    </span>
                    <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            plan === 'free'
                                ? 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300'
                                : 'bg-black text-white dark:bg-white dark:text-black'
                        }`}
                    >
                        {currentPlan.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {invoiceLimitText}
                    </span>
                </div>
                {isAtInvoiceLimit && (
                    <p className="text-sm font-medium">
                        You have reached your {currentPlan.name} invoice limit. Upgrade to add more invoices.
                    </p>
                )}
            </div>

            {plan !== 'pro' && (
                <a
                    href="/pricing"
                    className="text-sm bg-black text-white dark:bg-white dark:text-black px-5 py-2 rounded-full hover:opacity-80 transition text-center"
                >
                    {isAtInvoiceLimit ? 'View Plans' : 'Upgrade'}
                </a>
            )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 w-full">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Invoices
                </p>
                <p className="text-2xl font-semibold mt-2">
                    {invoices.length}
                </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Paid
                </p>
                <p className="text-2xl font-semibold mt-2">
                    {paidInvoices.length}
                </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Unpaid
                </p>
                <p className="text-2xl font-semibold mt-2">
                    {unpaidInvoices.length}
                </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Outstanding
                </p>
                <p className="text-2xl font-semibold mt-2">
                    {formatCurrency(outstandingRevenue)}
                </p>
            </div>
        </div>

        {hasPlusAccess && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500 dark:text-gray-400">Payment rate</span>
                        <span className="font-medium">{paymentRate}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-black dark:bg-white rounded-full transition-all"
                            style={{ width: `${paymentRate}%` }}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm mt-5">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">Collected</p>
                            <p className="font-semibold mt-1">{formatCurrency(totalRevenue)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">Average</p>
                            <p className="font-semibold mt-1">{formatCurrency(averageInvoiceValue)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between gap-4">
                        <h3 className="font-semibold">Client History</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Top {clientHistory.length}
                        </span>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {clientHistory.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Client history appears after you create invoices.
                            </p>
                        ) : (
                            clientHistory.slice(0, 4).map((client) => (
                                <div
                                    key={client.email}
                                    className="flex items-center justify-between gap-4 border border-gray-200 dark:border-zinc-800 rounded-lg p-3"
                                >
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">{client.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {client.email}
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                        {client.total} invoices
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

        {hasProAccess && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <h3 className="font-semibold">Overdue Insights</h3>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">Overdue</p>
                            <p className="text-xl font-semibold mt-1">{overdueInvoices.length}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">At Risk</p>
                            <p className="text-xl font-semibold mt-1">{formatCurrency(overdueRevenue)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">Due Soon</p>
                            <p className="text-xl font-semibold mt-1">{dueSoonInvoices.length}</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                        {oldestOverdue
                            ? `Follow up with ${oldestOverdue.clientName} first.`
                            : dueSoonInvoices.length > 0
                            ? `${dueSoonInvoices.length} unpaid invoices are due in the next 7 days.`
                            : 'No overdue invoices right now.'}
                    </p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <h3 className="font-semibold">Team Reporting</h3>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">Total Value</p>
                            <p className="font-semibold mt-1">{formatCurrency(totalInvoiceValue)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">Top Client</p>
                            <p className="font-semibold mt-1 truncate">{topClient?.name ?? 'None yet'}</p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-8">
            {/* Create Invoice Card */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-8 shadow-sm lg:col-span-1">

                <h3 className="text-lg font-semibold mb-6">
                    Create New Invoice
                </h3>

                <div className="flex flex-col gap-4">

                    <input 
                        required
                        className="border px-4 py-3 rounded-md bg-white dark:bg-zinc-800 dark:text-white border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                        placeholder="Client Full Name"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                    />

                    <input 
                        className="border px-4 py-3 rounded-md bg-white dark:bg-zinc-800 dark:text-white border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                        placeholder="Client Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <input
                        className="border px-4 py-3 rounded-md bg-white dark:bg-zinc-800 dark:text-white border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                        placeholder="Amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />

                    <input
                        className="border px-4 py-3 rounded-md bg-white dark:bg-zinc-800 dark:text-white border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />

                    <button
                        onClick={addInvoice}
                        className={`py-3 rounded-md font-medium transition ${
                            isAtInvoiceLimit
                                ? 'bg-gray-200 text-gray-500 dark:bg-zinc-800 dark:text-gray-400'
                                : 'bg-black text-white dark:bg-white dark:text-black hover:opacity-80'
                        }`}
                    >
                        {isAtInvoiceLimit ? 'Invoice Limit Reached' : 'Add Invoice'}
                    </button>
                </div>
            </div>

            {/* Invoice Table */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden lg:col-span-2">
            
                <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex flex-col gap-4">
                    <h3 className="text-lg font-semibold">
                        Invoices
                    </h3>
                    <div className="flex flex-col md:flex-row gap-3">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 border px-4 py-2 rounded-md bg-white dark:bg-zinc-800 dark:text-white border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                            placeholder="Search client, email, or amount"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as InvoiceStatusFilter)}
                            className="border px-4 py-2 rounded-md bg-white dark:bg-zinc-800 dark:text-white border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                        >
                            <option value="all">All invoices</option>
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="overdue">Overdue</option>
                        </select>
                    </div>
                </div>
                <div className="text-sm">
                    <div className="hidden md:grid grid-cols-[minmax(0,1.7fr)_minmax(88px,0.85fr)_minmax(92px,0.9fr)_minmax(96px,0.95fr)_88px_116px] gap-4 bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide px-6 py-4">
                        <div>Client</div>
                        <div>Amount</div>
                        <div>Due Date</div>
                        <div>Status</div>
                        <div>Reminder</div>
                        <div className="text-right">Actions</div>
                    </div>

                    {invoices.length === 0 && (
                        <div className="py-16 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="text-lg font-medium">
                                    No invoices yet
                                </div>
                                <div className="text-sm text-gray-500">
                                    Create your first invoice to get started.
                                </div>
                                <button
                                    onClick={() => {
                                        const input = document.querySelector<HTMLInputElement>('input[placeholder="Client Full Name"]')
                                        input?.focus()
                                    }}
                                    className="text-sm bg-black text-white dark:bg-white dark:text-black px-5 py-2 rounded-full hover:opacity-80 transition"
                                >
                                    Create Invoice
                                </button>
                            </div>
                        </div>
                    )}

                    {invoices.length > 0 && filteredInvoices.length === 0 && (
                        <div className="py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="text-lg font-medium">
                                    No matching invoices
                                </div>
                                <div className="text-sm text-gray-500">
                                    Clear the search or change the filter.
                                </div>
                            </div>
                        </div>
                    )}

                    {filteredInvoices.map((invoice) => {
                        const isOverdue = isInvoiceOverdue(invoice)

                        return (
                            <div
                                key={invoice.id}
                                className={`grid grid-cols-1 md:grid-cols-[minmax(0,1.7fr)_minmax(88px,0.85fr)_minmax(92px,0.9fr)_minmax(96px,0.95fr)_88px_116px] gap-4 md:gap-4 border-t border-gray-200 dark:border-zinc-800 px-5 md:px-6 py-5 md:py-4 transition items-start md:items-center ${
                                    isOverdue
                                        ? 'bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/40'
                                        : invoice.status === 'unpaid'
                                        ? 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30'
                                        : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                                }`}
                            >
                                <div className="min-w-0 flex flex-col gap-3 md:block">
                                    <div className="flex items-start justify-between gap-4 md:block">
                                        <div className="min-w-0">
                                            <div className="font-medium truncate">
                                                {invoice.clientName}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                {invoice.email}
                                            </div>
                                        </div>
                                        <div className="md:hidden shrink-0">
                                            <button
                                                onClick={() =>
                                                    toggleStatus(invoice.id, invoice.status)
                                                }
                                                title="Click to change status"
                                                className={`inline-flex max-w-full items-center justify-center px-3 h-8 rounded-full text-xs font-medium transition cursor-pointer ${
                                                    invoice.status === 'paid'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                        : isOverdue
                                                        ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                                }`}
                                            >
                                                {invoice.status === 'paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Unpaid'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="md:hidden grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-gray-500">Amount</p>
                                            <p className="font-medium truncate">${invoice.amount.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-gray-500">Due</p>
                                            <p className="truncate">{invoice.dueDate}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden md:block font-medium truncate">
                                    ${invoice.amount.toLocaleString()}
                                </div>

                                <div className="hidden md:block truncate">
                                    {invoice.dueDate}
                                </div>

                                <div className="hidden md:block">
                                    <button
                                        onClick={() =>
                                            toggleStatus(invoice.id, invoice.status)
                                        }
                                        title="Click to change status"
                                        className={`inline-flex max-w-full items-center justify-center px-3 h-8 rounded-full text-xs font-medium transition cursor-pointer hover:scale-105 active:scale-95 ${
                                            invoice.status === 'paid'
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                                                : isOverdue
                                                ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                                                : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300'
                                        }`}
                                    >
                                        <span className="truncate">
                                            {invoice.status === 'paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Unpaid'}
                                        </span>
                                    </button>
                                </div>

                                <div className="flex md:block">
                                    <button
                                        onClick={() => sendReminder(invoice)}
                                        className={`text-xs h-8 px-3 rounded-full transition ${
                                            plan === 'pro'
                                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700'
                                                : 'border border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-zinc-700 dark:text-gray-400 dark:hover:bg-zinc-800'
                                        }`}
                                    >
                                        Remind
                                    </button>
                                </div>

                                <div className="flex items-center justify-start md:justify-end gap-2 flex-wrap">
                                    <button
                                        onClick={() => openInvoice(invoice)}
                                        className="text-xs h-8 px-3 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800 transition"
                                    >
                                        View
                                    </button>
                                    <button
                                        onClick={() => deleteInvoice(invoice.id)}
                                        className="text-xs h-8 px-3 rounded-full border border-gray-300 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:border-zinc-700 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:border-red-900 transition shrink-0"
                                        aria-label="Delete invoice"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
        {selectedInvoice && invoiceDraft && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
                <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Invoice Details
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Edit invoice details, print a copy, or send a reminder.
                            </p>
                        </div>
                        <button
                            onClick={closeInvoice}
                            className="text-gray-500 hover:text-black dark:hover:text-white transition"
                            aria-label="Close invoice details"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            value={invoiceDraft.clientName}
                            onChange={(e) => setInvoiceDraft({ ...invoiceDraft, clientName: e.target.value })}
                            className="border px-4 py-3 rounded-md bg-white dark:bg-zinc-800 dark:text-white border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                            placeholder="Client full name"
                        />
                        <input
                            value={invoiceDraft.email}
                            onChange={(e) => setInvoiceDraft({ ...invoiceDraft, email: e.target.value })}
                            className="border px-4 py-3 rounded-md bg-white dark:bg-zinc-800 dark:text-white border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                            placeholder="Client email"
                        />
                        <input
                            value={invoiceDraft.amount}
                            onChange={(e) => setInvoiceDraft({ ...invoiceDraft, amount: e.target.value })}
                            className="border px-4 py-3 rounded-md bg-white dark:bg-zinc-800 dark:text-white border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                            placeholder="Amount"
                            type="number"
                        />
                        <input
                            value={invoiceDraft.dueDate}
                            onChange={(e) => setInvoiceDraft({ ...invoiceDraft, dueDate: e.target.value })}
                            className="border px-4 py-3 rounded-md bg-white dark:bg-zinc-800 dark:text-white border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                            type="date"
                        />
                        <select
                            value={invoiceDraft.status}
                            onChange={(e) => setInvoiceDraft({ ...invoiceDraft, status: e.target.value as 'paid' | 'unpaid' })}
                            className="md:col-span-2 border px-4 py-3 rounded-md bg-white dark:bg-zinc-800 dark:text-white border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                        >
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-3 sm:justify-between">
                        <div className="flex gap-3">
                            <button
                                onClick={() => printInvoice(selectedInvoice)}
                                className="text-sm border border-gray-300 dark:border-zinc-700 px-5 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
                            >
                                Print Invoice
                            </button>
                            <button
                                onClick={() => sendReminder(selectedInvoice)}
                                className="text-sm border border-gray-300 dark:border-zinc-700 px-5 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
                            >
                                Send Reminder
                            </button>
                        </div>
                        <button
                            onClick={updateInvoice}
                            className="text-sm bg-black text-white dark:bg-white dark:text-black px-5 py-2 rounded-full hover:opacity-80 transition"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        )}
    </main>
)
}
