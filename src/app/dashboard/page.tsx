'use client'

import { useState, useEffect} from 'react'
import { supabase } from '@/lib/supabase'

type Invoice = {
    id: string
    clientName: string
    email: string
    amount: number 
    dueDate: string
    status: 'paid' | 'unpaid'
}

export default function Dashboard() { // Dashboard component
    const [user, setUser] = useState<any>(null)
    const [clientName, setClientName] = useState('')
    const [email, setEmail] = useState('')
    const [amount, setAmount] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [plan, setPlan] = useState<string>('free')


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
            } else {
                setPlan(profile.plan)
            }
        }

        initialize()

        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null) // Update user state on auth state change
        })

        return () => {
            listener.subscription.unsubscribe() // Cleanup subscription on unmount
        }
    }, [])

    async function fetchInvoices() { // Fetch invoices from Supabase
        if (!user) return

        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('user_id', user.id)
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

    useEffect(() => {
        if (user) {
        fetchInvoices()
        } else {
        setInvoices([]) // Clear invoices on logout
        }
    }, [user])

    async function addInvoice() { // Add a new invoice
        if (plan === 'free' && invoices.length >= 3) {
            alert('Free plan limited to 3 invoices. Upgrade to Pro.')
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

    async function toggleStatus(id: string, currentStatus: string) { // Toggle invoice status
        const newStatus = currentStatus === 'unpaid' ? 'paid' : 'unpaid'
    
        await supabase
            .from('invoices')
            .update({ status: newStatus })
            .eq('id', id)
        fetchInvoices()
    }

    if (!user) return null

    return (
        <main className="flex flex-col gap-12 px-8 pt-10 max-w-7xl mx-auto transition-colors duration-300">
        <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 px-6 py-4 rounded-xl shadow-sm">
            
            <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Current Plan</span>

                <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        plan === 'free'
                            ? 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300'
                            : 'bg-black text-white dark:bg-white dark:text-black'
                    }`}
                >
                    {plan}
                </span>
            </div>

            {plan === 'free' && (
                <a 
                    href="/pricing"
                    className="text-sm bg-black text-white dark:bg-white dark:text-black px-5 py-2 rounded-full hover:opacity-80 transition"
                >
                    Upgrade to Pro
                </a>
            )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-zinc-800 hover:shadow-lg transition">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Invoices
                </p>
                <p className="text-2xl font-semibold mt-2">
                    {invoices.length}
                </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-zinc-800 hover:shadow-lg transition">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Paid
                </p>
                <p className="text-2xl font-semibold mt-2">
                    {invoices.filter((i) => i.status === 'paid').length}
                </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-zinc-800 hover:shadow-lg transition">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Unpaid
                </p>
                <p className="text-2xl font-semibold mt-2">
                    {invoices.filter((i) => i.status === 'unpaid').length}
                </p>
            </div>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between w-full max-w-6xl">
            <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                    Dashboard
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Manage and track your invoices.
                </p>
            </div>
        </div>

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
                        className="bg-black text-white dark:bg-white dark:text-black py-3 rounded-md font-medium hover:opacity-80 transition"
                    >
                        Add Invoice
                    </button>
                </div>
            </div>

            {/* Invoice Table */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden lg:col-span-2">
            
                <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
                    <h3 className="text-lg font-semibold">
                        Invoices
                    </h3>
                </div>
                <div>
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                            <tr>
                                <th className="text-left px-6 py-4 w-[35%]">Client</th>
                                <th className="text-left px-6 py-4 w-[20%]">Amount</th>
                                <th className="text-left px-6 py-4 w-[25%]">Due Date</th>
                                <th className="text-left px-6 py-4 w-[15%]">Status</th>
                                <th className="px-6 py-4 w-12"></th>
                            </tr>
                        </thead>
                
                        <tbody>
                            {invoices.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="text-4xl">📄</div>
                                            <div className="text-lg font-medium">
                                                No invoices yet
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Create your first invoice to get started.
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                    
                            {invoices.map((invoice) => {
                                const today = new Date()
                                const due = new Date(invoice.dueDate)

                                // Remove time from today so it compares correctly
                                today.setHours(0, 0, 0, 0)

                                const isOverdue =
                                    invoice.status === 'unpaid' && due < today

                                return (
                                    <tr
                                        key={invoice.id}
                                        className={`border-t border-gray-200 dark:border-zinc-800 transition align-middle ${
                                            isOverdue
                                                ? 'bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/40'
                                                : invoice.status === 'unpaid'
                                                ? 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30'
                                                : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                                        }`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{invoice.clientName}</span>
                                                <span className="text-xs text-gray-500">{invoice.email}</span>
                                            </div>
                                        </td>

                                    <td className="px-6 py-4 font-medium">
                                        ${invoice.amount.toLocaleString()}
                                    </td>

                                    <td className="px-6 py-4">{invoice.dueDate}</td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <button
                                                onClick={() =>
                                                    toggleStatus(invoice.id, invoice.status)
                                                }
                                                title="Click to change status"
                                                className={`flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer hover:scale-105 active:scale-95 ${
                                                    invoice.status === 'paid'
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                                                        : isOverdue
                                                        ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                                                        : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300'
                                                }`}
                                            >
                                                {invoice.status === 'paid' ? (
                                                    <div className="flex items-center gap-1">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="w-3 h-3"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M16.707 5.293a1 1 0 010 1.414l-7.75 7.75a1 1 0 01-1.414 0l-3.75-3.75a1 1 0 011.414-1.414L8 11.586l7.043-7.043a1 1 0 011.414 0z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                        <span>Paid</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="w-3 h-3"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-4h2v2H9v-2zm0-8h2v6H9V6z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                        <span>
                                                            {isOverdue ? 'Overdue' : 'Unpaid'}
                                                        </span>
                                                    </div>
                                                )}
                                            </button>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => deleteInvoice(invoice.id)}
                                            className="text-gray-400 hover:text-red-500 transition"
                                        >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-5 h-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M6 7h12M9 7V4h6v3m-7 4v6m4-6v6m5-10H5l1 14h12l1-14z"
                                            />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>
)
}