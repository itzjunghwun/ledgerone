'use client' 
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Invoice = { // Invoice type definition
  id: string
  email: string
  amount: number
  dueDate: string
  status: 'paid' | 'unpaid'
}

export default function Home() { // Main component (Dashboard State)
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [user, setUser] = useState<any>(null)
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authSuccess, setAuthSuccess] = useState<string | null>(null)

  const [loginEmail, setLoginEmail] = useState('') // Login State
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  async function fetchInvoices() { // Fetch invoices from Supabase
    if (!user) return

    const { data, error } = await supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false })

    if (error) {
      console.error("Error fetching invoices:", error) // Log any errors
      return
    }

    const formatted = data.map((invoice) => ({ // Format the fetched invoices
      id: invoice.id,
      email: invoice.email,
      amount: invoice.amount,
      dueDate: invoice.due_date,
      status: invoice.status,
    }))

    setInvoices(formatted) // Update the state with the fetched invoices
  }

  useEffect(() => { // Fetch invoices on component mount (Auth Initialization + Listener)
    async function initialize() {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    initialize()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchInvoices()
    } else {
      setInvoices([]) // Clear invoices on logout
    }
  }, [user])

  async function addInvoice() { // Add a new invoice
    if (!email || !amount || !dueDate || !user) return

    const { error } = await supabase.from('invoices').insert([ // Insert a new invoice
      {
        email: email, // Client email
        amount: Number(amount), // Convert amount to number
        due_date: dueDate, // Convert dueDate to string
        user_id: user.id, // Associate invoice with user
      },
    ])

    if (error) { // Log any errors
      console.error('Error inserting invoice:', error)
      return
    } 

    await fetchInvoices() // Refresh the invoice list

    setEmail('') // Clear the email input
    setAmount('') // Clear the amount input
    setDueDate('') // Clear the due date input
  }

  async function deleteInvoice(id: string) { // Delete an invoice
    const { error } = await supabase.from('invoices').delete().eq('id', id) // .eq('id', id) -> WHERE id = ?

    if (error) { // Log any errors
      console.error('Error deleting invoice:', error)
      return
    }

    await fetchInvoices() // Refresh the invoice list
  }

  async function toggleStatus(id: string, currentStatus: string) { // Toggle invoice status
    const newStatus = currentStatus === 'unpaid' ? 'paid' : 'unpaid'
    
    const { error } = await supabase
      .from('invoices')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      console.error('Error updating invoice status:', error)
      return
    }

    await fetchInvoices() // Refresh the invoice list
  }

  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  }

  const passwordValid = 
    passwordRequirements.length &&
    passwordRequirements.uppercase &&
    passwordRequirements.lowercase &&
    passwordRequirements.number
  
  const strengthScore = password 
    ? Object.values(passwordRequirements).filter(Boolean).length
    : 0
    const hasTypedPassword = password.length > 0

  async function handleAuth() {
    setAuthError(null) // Clear previous error
    setAuthSuccess(null) // Clear previous success message

    if (!loginEmail || !password) {
      setAuthError('Please enter both email and password')
      return
    }

    setLoading(true)

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password }) // Sign in with email and password

      if (error) {
        setAuthError(
          'Invalid email or password. Please try again.'
        )
        setLoading(false)
        return
      }
    } else {
      // Block sign up if password is invalid
      if (!passwordValid) {
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.signUp({
        email: loginEmail,
        password: password,
        options: {
          emailRedirectTo: 'http://localhost:3000', // Redirect URL after email verification
        },
      }) // Sign up with email and password

      if (error) {
        setAuthError("Please enter a valid email and password.") // Show error message
        setLoading(false)
        return
      }

      setAuthSuccess(
        'Account created successfully! Please check your email to verify before logging in.'
      )
    }
    setLoading(false)
  }

  if (!user) { // Login Screen with Email and Password OR create account
    return  (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white shadow-2xl rounded-2xl p-12 w-[420px] flex flex-col gap-6">
          <h1 className="text-2xl font-semibold text-center text-black">
            {isLogin ? 'Login' : 'Create a New Account'} {/* Separate create account section */}
          </h1>

          {/* Floating Email Input */}
          <div className="relative">
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder=" "
              className="
                peer
                w-full
                border border-black
                px-4 pt-6 pb-2
                rounded-md
                text-black
                focus:outline-none
              "
            />
            <label 
              className="
                absolute left-3
                bg-white px-1
                text-gray-500
                transition-all
                pointer-events-none
                peer-placeholder-shown:top-4
                peer-placeholder-shown:text-base
                peer-focus:top-1
                peer-focus:text-xs
                peer-focus:text-black
                top-1 text-xs
              "
            >
              Email
            </label>
          </div>

          {/* Floating Password Input */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              className="
                peer
                w-full
                border border-black
                px-4 pt-6 pb-2 pr-12
                rounded-md
                text-black
                focus:outline-none
              "
            />
            <label
              className="
                absolute left-3
                bg-white px-1
                text-gray-500
                transition-all
                pointer-events-none
                peer-placeholder-shown:top-4
                peer-placeholder-shown:text-base
                peer-focus:top-1
                peer-focus:text-xs
                peer-focus:text-black
                top-1 text-xs
              "
            >
              Password
            </label>

            {/* Show Password Toggle */}
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 translate-y-[-50%] text-gray-500 hover:text-black transition"
            >
              {showPassword ? (
              /*Eye Off SVG */
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17.94 17.94A10.94 10.94 0 0112 19C7 19 2.73 15.11 1 12c.66-1.23 1.63-2.52 2.88-3.73M9.9 4.24A10.94 10.94 0 0112 5c5 0 9.27 3.89 11 7a10.94 10.94 0 01-4.06 4.94M1 1l22 22"/>
              </svg>
              ) : (
                /* Eye On SVG */
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          {/* Remember Me + Forgot*/}
          {isLogin && (
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-black"
                />
                Remember Me
              </label>

              <button
                type="button"
                onClick={async () => {
                  if (!loginEmail) {
                    setAuthError("Please enter your email");
                    return
                  }

                  await supabase.auth.resetPasswordForEmail(loginEmail, {
                    redirectTo: "http://localhost:3000",
                  })

                  setAuthSuccess("Password reset email sent.")
                }}
                className="text-blue-500 text-xs hover:underline self-end"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Live Password Requirements (Only Show on Sign Up) */}
          {!isLogin && (
            <div className="text-sm space-y-1">
              <p className={`font-medium ${hasTypedPassword ? "text-gray-600" : "text-gray-400"}`}>Password must contain:</p>

              <ul className="ml-5 space-y-1">
                <li 
                  className={
                    !hasTypedPassword
                    ? "text-gray-400"
                    : passwordRequirements.length
                    ? "text-green-600"
                    : "text-red-500"
                  }
                >
                  At least 8 characters long
                </li>
                <li 
                  className={
                    !hasTypedPassword
                    ? "text-gray-400"
                    : passwordRequirements.uppercase
                    ? "text-green-600"
                    : "text-red-500"
                  }
                >
                  At least 1 uppercase letter
                </li>
                <li 
                  className={
                    !hasTypedPassword
                    ? "text-gray-400"
                    : passwordRequirements.lowercase
                    ? "text-green-600"
                    : "text-red-500"
                  }
                >
                  At least 1 lowercase letter
                </li>
                <li 
                  className={
                    !hasTypedPassword
                    ? "text-gray-400"
                    : passwordRequirements.number
                    ? "text-green-600"
                    : "text-red-500"
                  }
                >
                  At least 1 number
                </li>
              </ul>
            </div>
          )}

          {/* Password Strength Bar */}
          {!isLogin && (
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    strengthScore === 0
                      ? "w-0"
                      : strengthScore === 1
                      ? "w-1/4 bg-red-500"
                      : strengthScore === 2
                      ? "w-2/4 bg-yellow-500"
                      : strengthScore === 3
                      ? "w-3/4 bg-green-500"
                      : "w-full bg-green-600"
                  }`}
                />
              </div>
            </div>
          )}
          
          {/* Error Message */}
          {authError && (
            <p className="text-red-500 text-sm text-center">
              {authError}
            </p>
          )}

          {/* Success Message */}
          {authSuccess && (
            <p className="text-green-500 text-sm text-center">
              {authSuccess}
            </p>
          )}

          {/* Auth Button */}
          <button
            onClick={handleAuth}
            className={`p-2 rounded transition text-white ${
              isLogin
              ? "bg-blue-500 hover:bg-blue-700 active:scale-[0.98]"
              : passwordValid
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 cursor-not-allowed"
            }`}
            disabled={loading || (!isLogin && !passwordValid)}
          >
            {loading 
            ? 'Processing...' 
            : isLogin
            ? 'Login'
            : 'Sign Up'}
          </button>

          {/* Toggle Login/Register */}
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setAuthError(null) // Clear error when toggling
              setAuthSuccess(null) // Clear success message when toggling
            }}
            className="text-center text-sm text-blue-500"
          >
            {isLogin 
            ? "Don't have an account?" 
            : 'Already have an account?'}
          </button>
        </div>
      </div>
    )
  }

  return ( // Main component return (Dashboard)
    <main className="min-h-screen flex flex-col items-center justify-center gap-6"> 
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">Invoice Reminders</h1>

        <button // Logout button
          onClick={async () => {
            await supabase.auth.signOut()
          }}
          className="bg-gray-200 text-black px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
      
      <h2 className="text-xl font-bold">
        Create Your Invoices Below!
      </h2>

      <div className="flex flex-col gap-2 w-64"> 
        <input
          className="border px-3 py-2 rounded" // Client email input
          placeholder="Client email" // Placeholder for client email
          value={email} // Value for client email
          onChange={(e) => setEmail(e.target.value)} // Update email state
        />

        <input
          className="border px-3 py-2 rounded" // Invoice amount input
          placeholder="Amount" // Placeholder for invoice amount
          type="number" // Type for invoice amount
          value={amount} // Value for invoice amount
          onChange={(e) => setAmount(e.target.value)} // Update amount state
        />

        <input
          className="border px-3 py-2 rounded" 
          type="date"
          value={dueDate} // Value for due date
          onChange={(e) => setDueDate(e.target.value)} // Update due date state
        />

        <button // Add Invoice button
          className="bg-white text-black px-4 py-2 rounded"
          onClick={addInvoice}
        >
          Add Invoice
        </button>
      </div>

        <ul className="mt-4"> 
          {invoices.map((invoice) => ( // Map through invoices
            <li key={invoice.id} className="border p-4 w-80"> 
              <p>Email: {invoice.email}</p>
              <p>Amount: ${invoice.amount}</p>
              <p>Due: {invoice.dueDate}</p>
              <p>
                Status:{' '}
                <span className={`font-bold ${invoice.status === 'paid' ? 'text-green-500' : 'text-red-500'}`}>
                  {invoice.status}
                </span>
              </p>

              <div className="mt-3 flex gap-3">
                <button // Delete button
                  className="flex-1 bg-red-500 hover:bg-red-600 transition text-white py-2 rounded" // flex-1 forces both buttons to take equal width
                  onClick={() => deleteInvoice(invoice.id)}
                >
                  Delete
                </button>

                <button // Toggle Status button
                  className="flex-1 bg-blue-500 hover:bg-blue-600 transition text-white py-2 rounded text-center"
                  onClick={() => toggleStatus(invoice.id, invoice.status)} // We pass invoice.status into toggleStatus instead of just reading from state inside the function because we are capturing the EXACT current status at the moment the button is clicked, which makes the function predictable, pure, and not dependent on outer state
                >
                  Mark as {invoice.status === 'unpaid' ? 'Paid' : 'Unpaid'}
                </button>
              </div>
              
            </li>
          ))}
        </ul>
    </main>
  )
}
