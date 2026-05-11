'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type InvoiceRow = {
    id: string
    client_name: string
    email: string
    amount: number
    due_date: string
    status: string
}

type ClientSummary = {
    name: string
    email: string
    invoices: number
    paid: number
    unpaid: number
    totalValue: number
    lastDueDate: string
}

function formatCurrency(amount: number) {
    return amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    })
}

export default function ClientsPage() {
    const [clients, setClients] = useState<ClientSummary[]>([])
    const [search, setSearch] = useState('')

    useEffect(() => {
        async function loadClients() {
            const { data: userData } = await supabase.auth.getUser()
            const user = userData.user

            if (!user) return

            const { data, error } = await supabase
                .from('invoices')
                .select('id, client_name, email, amount, due_date, status')
                .eq('user_id', user.id)

            if (error || !data) return

            const summaries = (data as InvoiceRow[]).reduce((map, invoice) => {
                const key = invoice.email.toLowerCase()
                const current = map.get(key) ?? {
                    name: invoice.client_name,
                    email: invoice.email,
                    invoices: 0,
                    paid: 0,
                    unpaid: 0,
                    totalValue: 0,
                    lastDueDate: invoice.due_date,
                }

                current.invoices += 1
                current.paid += invoice.status.replace(/'/g, '') === 'paid' ? 1 : 0
                current.unpaid += invoice.status.replace(/'/g, '') === 'unpaid' ? 1 : 0
                current.totalValue += invoice.amount

                if (new Date(invoice.due_date) > new Date(current.lastDueDate)) {
                    current.lastDueDate = invoice.due_date
                }

                map.set(key, current)
                return map
            }, new Map<string, ClientSummary>())

            setClients(
                Array.from(summaries.values()).sort((a, b) => b.totalValue - a.totalValue)
            )
        }

        loadClients()
    }, [])

    const filteredClients = clients.filter((client) => {
        const query = search.trim().toLowerCase()

        return (
            !query ||
            client.name.toLowerCase().includes(query) ||
            client.email.toLowerCase().includes(query)
        )
    })

    return (
        <main className="flex flex-col gap-8 px-8 pt-10 max-w-7xl mx-auto transition-colors duration-300">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Clients
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Review client relationships and invoice history.
                    </p>
                </div>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border px-4 py-2 rounded-md bg-white dark:bg-zinc-800 dark:text-white border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                    placeholder="Search clients"
                />
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                        <tr>
                            <th className="text-left px-6 py-4">Client</th>
                            <th className="text-left px-6 py-4">Invoices</th>
                            <th className="text-left px-6 py-4">Paid</th>
                            <th className="text-left px-6 py-4">Unpaid</th>
                            <th className="text-left px-6 py-4">Total Value</th>
                            <th className="text-left px-6 py-4">Latest Due Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClients.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-16 text-center">
                                    <div className="text-lg font-medium">
                                        No clients yet
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        Clients appear automatically after you create invoices.
                                    </p>
                                </td>
                            </tr>
                        )}

                        {filteredClients.map((client) => (
                            <tr
                                key={client.email}
                                className="border-t border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{client.name}</span>
                                        <span className="text-xs text-gray-500">{client.email}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{client.invoices}</td>
                                <td className="px-6 py-4">{client.paid}</td>
                                <td className="px-6 py-4">{client.unpaid}</td>
                                <td className="px-6 py-4 font-medium">
                                    {formatCurrency(client.totalValue)}
                                </td>
                                <td className="px-6 py-4">{client.lastDueDate}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>
    )
}
