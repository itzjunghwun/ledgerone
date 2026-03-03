'use client'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Navbar({ user }: {user: any }) {
    const router = useRouter()

    return (
        <nav className="w-full bg-black text-white border-b border-gray-800 px-8 py-4 flex justify-between items-center">
            <div 
                onClick={() => router.push('/dashboard')}
                className="text-xl font-semiboldcursor-pointer"
            >
                LedgerOne
            </div>
            <div className="flex items-center gap-6 text-sm">
                <button
                    onClick={() => router.push('/pricing')}
                    className="hover:text-gray-400 transition"
                >
                    Pricing
                </button>

                {user && (
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut()
                            router.push('/')
                        }}
                        className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 transition"
                    >
                        Logout
                    </button>
                )}
            </div>
        </nav>
    )
}