export default function Footer() {
    return (
        <footer className="border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-white">
            <div className="max-w-7xl mx-auto px-8 py-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="text-xl font-semibold">
                        LedgerOne
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Billing clarity, from send to paid.
                    </p>
                </div>

                <div className="flex flex-col gap-2 md:items-end text-sm text-gray-500 dark:text-gray-400">
                    <a
                        href="mailto:support@ledgerone.app"
                        className="hover:text-black dark:hover:text-white transition"
                    >
                        support@ledgerone.app
                    </a>
                    <p>
                        © 2026 LedgerOne. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
