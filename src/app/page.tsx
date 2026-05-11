export default function LandingPage() {
  return (
    <div id="top" className="min-h-screen bg-white text-black flex flex-col overflow-x-hidden pt-[73px]">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-3 border-b bg-white/90 backdrop-blur">
        <a href="#top" className="text-2xl font-semibold hover:opacity-70 transition">
          LedgerOne
        </a>

        <div className="flex items-center gap-6 text-sm">
          <a href="/pricing">Pricing</a>
          <a href="/login">Log In</a>
          <a
            href="/login?mode=signup"
            className="bg-black text-white px-4 py-2 rounded-full hover:opacity-80 transition"
            >
              Get Started
            </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[78vh] flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="invoice-hero-animation" aria-hidden="true">
          <div className="invoice-grid" />
          <div className="hero-focus-veil" />

          <div className="dashboard-preview dashboard-preview-left">
            <div className="preview-card-header">
              <span>Create New Invoice</span>
            </div>
            <div className="preview-input" />
            <div className="preview-input" />
            <div className="preview-input short" />
            <div className="preview-button" />
          </div>

          <div className="dashboard-preview dashboard-preview-right">
            <div className="preview-card-header">
              <span>Invoices</span>
              <em>3 active</em>
            </div>
            <div className="preview-table-row">
              <span />
              <span />
              <strong />
            </div>
            <div className="preview-table-row">
              <span />
              <span />
              <strong className="unpaid" />
            </div>
            <div className="preview-table-row">
              <span />
              <span />
              <strong />
            </div>
          </div>

          <div className="dashboard-metric metric-one">
            <span>Total Invoices</span>
            <strong>3</strong>
          </div>
          <div className="dashboard-metric metric-two">
            <span>Paid</span>
            <strong>2</strong>
          </div>
          <div className="dashboard-metric metric-three">
            <span>Outstanding</span>
            <strong>$4,200</strong>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-5xl md:text-6xl font-semibold max-w-4xl">
            Billing clarity, from send to paid.
          </h1>

          <p className="mt-6 text-gray-600 max-w-2xl text-lg">
            Create invoices, track payments, follow up with clients, and understand cash flow in one quiet, focused workspace.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <a
              href="/login"
              className="bg-black text-white px-7 py-3 rounded-full hover:opacity-80 transition"
            >
              Get Started
            </a>

            <a
              href="/pricing"
              className="border border-black px-8 py-3 rounded-full hover:bg-gray-50 transition"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t bg-white px-8 py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-sm font-semibold text-gray-500">
              Why LedgerOne?
            </p>
            <h2 className="mt-3 text-4xl font-semibold max-w-xl">
              Stop chasing invoices. Start steering cash flow.
            </h2>
            <p className="mt-5 text-lg text-gray-600 max-w-xl">
              LedgerOne gives small teams a calm command center for billing: what was sent, what is overdue, who needs a reminder, and how much money is still on the table.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3 max-w-xl">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-2xl font-semibold">3x</div>
                <p className="text-xs text-gray-500 mt-1">faster invoice review</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-2xl font-semibold">1</div>
                <p className="text-xs text-gray-500 mt-1">place for every client</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-2xl font-semibold">$0</div>
                <p className="text-xs text-gray-500 mt-1">to start tracking</p>
              </div>
            </div>

            <a
              href="/login?mode=signup"
              className="inline-flex mt-8 bg-black text-white px-6 py-3 rounded-full hover:opacity-80 transition"
            >
              Start with Free
            </a>
          </div>

          <div className="border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Invoice workflow</h3>
                <p className="text-sm text-gray-500">From sent to paid, without the spreadsheet shuffle.</p>
              </div>
              <span className="text-xs bg-black text-white px-3 py-1 rounded-full">
                Live status
              </span>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-semibold shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Create and send with confidence</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Build a clean invoice with client details, due date, amount, and status in seconds.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-semibold shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">See risk before it becomes a problem</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Overdue and unpaid invoices rise to the top so your next action is obvious.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-semibold shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Follow up and report without busywork</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Export CSVs, review client history, and send reminders when billing volume grows.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 border-t border-gray-200 text-sm">
              <div className="p-5">
                <p className="text-gray-500">Track</p>
                <p className="font-semibold mt-1">Paid / unpaid</p>
              </div>
              <div className="p-5 border-l border-gray-200">
                <p className="text-gray-500">Act</p>
                <p className="font-semibold mt-1">Reminders</p>
              </div>
              <div className="p-5 border-l border-gray-200">
                <p className="text-gray-500">Report</p>
                <p className="font-semibold mt-1">CSV + insights</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
