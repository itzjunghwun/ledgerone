'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function BrandLink() {
    const [href, setHref] = useState('/')

    useEffect(() => {
        async function loadDestination() {
            const { data } = await supabase.auth.getUser()
            setHref(data.user ? '/dashboard' : '/')
        }

        loadDestination()

        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            setHref(session?.user ? '/dashboard' : '/')
        })

        return () => {
            listener.subscription.unsubscribe()
        }
    }, [])

    return (
        <Link href={href} className="text-2xl font-semibold hover:opacity-70 transition">
            LedgerOne
        </Link>
    )
}
