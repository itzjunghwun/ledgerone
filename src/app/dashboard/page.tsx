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
            status: invoice.status,
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
        <main className="flex flex-col items-center gap-12 px-8 pt-20 transition-colors duration-300">
        <h1 className="text-3xl font-bold">Invoice Reminders</h1>
        <h2 className="text-xl font-bold">
            Create Your Invoices Here!
        </h2>

        <div className="flex flex-col gap-2 w-64">
            <input 
                className="
                border 
                px-3 py-2 
                rounded-md 
                bg-white text-black 
                dark:bg-zinc-800 dark:text-white 
                border-gray-300 dark:border-zinc-700
                focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
                transition-colors duration-300
                "
                placeholder="Client Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input 
                className="
                border 
                px-3 py-2 
                rounded-md 
                bg-white text-black 
                dark:bg-zinc-800 dark:text-white 
                border-gray-300 dark:border-zinc-700
                focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
                transition-colors duration-300
                "
                placeholder="Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
            />
            <input 
                className="
                border 
                px-3 py-2 
                rounded-md 
                bg-white text-black 
                dark:bg-zinc-800 dark:text-white 
                border-gray-300 dark:border-zinc-700
                focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
                transition-colors duration-300
                "
                type="date"
                placeholder="Due Date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
            />

            <button
                className="
                    bg-black text-white 
                    dark:bg-white dark:text-black 
                    px-4 py-2 
                    rounded-md 
                    transition-colors duration-300 
                    hover:opacity-80
                "
                onClick={addInvoice}
            >
                Add Invoice
            </button>
        </div>

        <ul className="mt-4">
            {invoices.map((invoice) => (
                <li key={invoice.id} className="border p-5 w-96 bg-white dark:bg-zinc-900 text-black dark:text-white border-gray-200 dark:border-zinc-700 rounded-xl shadow-md dark:shadow-none transition-colors duration-300">
                    <p>Email: {invoice.email}</p>
                    <p>Amount: ${invoice.amount}</p>
                    <p>Due: {invoice.dueDate}</p>
                    <p>
                        Status:{' '}
                        <span
                            className={`font-bold ${
                                invoice.status === 'paid'
                                    ? 'text-green-500'
                                    : 'text-red-500'
                            }`}
                        >
                            {invoice.status}
                        </span>
                    </p>

                    <div className="mt-3 flex gap-3">
                        <button
                            className="flex-1 bg-red-500 hover:bg-red-600 transition text-white py-2 rounded"
                            onClick={() => deleteInvoice(invoice.id)}
                        >
                            Delete
                        </button>

                        <button
                            className="flex-1 bg-blue-500 hover:bg-blue-600 transition text-white py-2 rounded"
                            onClick={() =>
                                toggleStatus(invoice.id, invoice.status)
                            }
                        >
                            Mark as{' '}
                            {invoice.status === 'unpaid' ? 'Paid' : 'Unpaid'}
                        </button>
                    </div>
                </li>
            ))}
        </ul>
    </main>
)
}