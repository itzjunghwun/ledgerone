'use client'

import { useState, useEffect} from 'react'
import { supabase } from '@/lib/supabase'

type Invoice = {
    id: string
    email: string
    amount: number 
    dueDate: string
    status: 'paid' | 'unpaid'
}

export default function Dashboard() { // Dashboard component
    const [user, setUser] = useState<any>(null)
    const [email, setEmail] = useState('')
    const [amount, setAmount] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [invoices, setInvoices] = useState<Invoice[]>([])


    useEffect(() => { // Fetch user on mount
        async function initialize() {
            const { data } = await supabase.auth.getUser() // Fetch user data
            setUser(data.user)
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
        if (!email || !amount || !dueDate || !user) return

        await supabase.from('invoices').insert([ // Insert a new invoice
        {
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

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Invoices
                </p>
                <p className="text-2xl font-semibold mt-2">
                    {invoices.length}
                </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Paid
                </p>
                <p className="text-2xl font-semibold mt-2">
                    {invoices.filter((i) => i.status === 'paid').length}
                </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800">
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
                                    <td colSpan={5} className="text-center py-10 text-gray-500">
                                        No invoices found.
                                    </td>
                                </tr>
                            )}
                    
                            {invoices.map((invoice) => (
                                <tr
                                    key={invoice.id}
                                    className="border-t border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 transition align-middle"
                                >
                                    <td className="px-6 py-4">{invoice.email}</td>

                                    <td className="px-6 py-4 font-medium">
                                        ${invoice.amount.toLocaleString()}
                                    </td>

                                    <td className="px-6 py-4">{invoice.dueDate}</td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            {/* Status Toggle */}
                                            <button
                                                onClick={() => toggleStatus(invoice.id, invoice.status)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                                                    invoice.status === "paid"
                                                        ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
                                                        : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300"
                                                }`}
                                            >
                                                {invoice.status}
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>
)
}