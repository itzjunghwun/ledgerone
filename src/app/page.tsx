export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-10 py-3 border-b">
        <div className="text-lg font-semibold tracking-tight">
          LedgerOne
        </div>

        <div className="flex items-center gap-6 text-sm">
          <a href="/pricing">Pricing</a>
          <a href="/login">Log In</a>
          <a
            href="/login?mode=signup"
            className="bg-black text-white px-4 py-2 rounded-full"
            >
              Get Started
            </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center flex-1 text-center px-6">
        <h1 className="text-5xl font-semibold tracking-tight max-w-3xl">
          A modern invoice management built for simplicity.
        </h1>

        <p className="mt-6 text-gray-600 max-w-xl">
          Create, manage, and track invoices in a clean, minimal dashboard designed for modern businesses.
        </p>

        <div className="mt-10 flex gap-4">
          <a
            href="/login"
            className="bg-black text-white px-6 py-3 rounded-full"
          >
            Get Started
          </a>

          <a
            href="/pricing"
            className=" border px-8 py-3 rounded-full"
          >
            View Pricing
          </a>
        </div>
      </section>
    </div>
  )
}

