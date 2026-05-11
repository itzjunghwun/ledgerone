'use client'

import { Suspense, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() { // Main component (Dashboard State)
  const router = useRouter()
  const [password, setPassword] = useState('')
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode")

  const [isLogin, setIsLogin] = useState(mode !== "signup")
  const [authError, setAuthError] = useState<string | null>(null)
  const [authSuccess, setAuthSuccess] = useState<string | null>(null)

  const [loginEmail, setLoginEmail] = useState('') // Login State
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => { // Fetch invoices on component mount (Auth Initialization + Listener)
    async function initialize() {
      const { data } = await supabase.auth.getUser()

      if (data.user) {
        router.push('/dashboard')
      }
    }
    initialize()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          router.push('/dashboard')
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [router])

  const passwordRequirements = {
    length: password.length >= 10,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }

  const passwordValid = 
    passwordRequirements.length &&
    passwordRequirements.uppercase &&
    passwordRequirements.lowercase &&
    passwordRequirements.number &&
    passwordRequirements.symbol

  const canSubmit = isLogin
    ? loginEmail.length > 0 && password.length > 0
    : loginEmail.length > 0 && passwordValid

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

    // Login logic
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      }) // Sign in with email and password

      if (error) {
        setAuthError("Invalid email or password. Please try again.")
        setLoading(false)
        return
      }

      setLoading(false)
      return
    }

      const { error } = await supabase.auth.signUp({
        email: loginEmail,
        password,
        options: {
          emailRedirectTo: "http://localhost:3000", // Redirect URL after email verification
        },
      })

      if (error) {
        // Detect duplicate email
        if (
          error.message.toLowerCase().includes("already") ||
          error.message.toLowerCase().includes("exists")
        ) {
          setAuthError(
            "An account with this email already exists. Try logging in instead."
          )
        } else {
          setAuthError(error.message)
        }

        setLoading(false)
        return
      }

      setAuthSuccess(
        "If this email is not already registered, you will receive a verification email shortly." // 
      )

    setLoading(false)
  }
    
    // Login Screen with Email and Password OR create account
    return  (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 px-4">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-10 flex flex-col gap-6">
          
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <h1 className="text-2xl text-black font-semibold tracking-tight">
              LedgerOne
            </h1>
            <p className="text-sm text-gray-500 text-center">
              Smart invoice management for modern businesses
            </p>
          </div>

          <h2 className="text-center text-gray-700 font-medium">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </h2>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleAuth()
            }}
            className="flex flex-col gap-6"
          >

          {/* Floating Email Input */}
          <div className="relative">
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder=" "
              className="peer w-full border border-gray-300 px-4 pt-6 pb-2 rounded-md focus:outline-none focus:ring-2 focus:ring-black caret-black text-black"
            />
            <label className="absolute left-3 top-1 text-xs text-gray-500 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs transition-all"
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
              className="peer w-full border border-gray-300 px-4 pt-6 pb-2 rounded-md focus:outline-none focus:ring-2 focus:ring-black caret-black text-black"
            />
            <label className="absolute left-3 top-1 text-xs text-gray-500 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs transition-all">
              Password
            </label>

            {/* Show / Hide Password Button */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-black transition"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17.94 17.94A10.94 10.94 0 0112 19C7 19 2.73 15.11 1 12c.66-1.23 1.63-2.52 2.88-3.73M9.9 4.24A10.94 10.94 0 0112 5c5 0 9.27 3.89 11 7a10.94 10.94 0 01-4.06 4.94M1 1l22 22"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          {/* Password Requirements + Strength (Sign Up Only) */}
          {!isLogin && (
            <div className="text-sm space-y-2">
              <p className={`font-medium ${hasTypedPassword ? "text-gray-700" : "text-gray-400"}`}>
                Password must contain:
              </p>

              <ul className="ml-5 space-y-1">
                <li className={
                  !hasTypedPassword
                    ?"text-gray-600"
                    :passwordRequirements.length
                    ? "text-green-600"
                    : "text-red-500"
                }>
                  At least 10 characters
                </li>
                
                <li className={
                  !hasTypedPassword
                    ? "text-gray-600"
                    : passwordRequirements.uppercase
                    ?"text-green-600"
                    : "text-red-500"
                }>
                  At least 1 uppercase letter
                </li>

                <li className={
                  !hasTypedPassword
                    ? "text-gray-600"
                    : passwordRequirements.lowercase
                    ?"text-green-600"
                    : "text-red-500"
                }>
                  At least 1 lowercase letter
                </li>

                <li className={
                  !hasTypedPassword
                    ? "text-gray-600"
                    : passwordRequirements.number
                    ?"text-green-600"
                    : "text-red-500"
                }>
                  At least 1 number
                </li>

                <li className={
                  !hasTypedPassword
                    ? "text-gray-600"
                    : passwordRequirements.symbol
                    ?"text-green-600"
                    : "text-red-500"
                }>
                  At least 1 special character
                </li>
              </ul>

              {/* Strength Bar */}
              <div className="mt-2">
                <div className="h-2 bg-gray-200 rounded-full"> {/* Strength bar background */}
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${ 
                      strengthScore === 0
                        ? "w-0"
                        : strengthScore === 1
                        ? "w-1/5 bg-red-500"
                        : strengthScore === 2
                        ? "w-2/5 bg-orange-500"
                        : strengthScore === 3
                        ? "w-3/5 bg-yellow-500"
                        : strengthScore === 4
                        ? "w-4/5 bg-green-400"
                        : "w-full bg-green-600"
                    }`}
                    />
                  </div>
                </div>
              </div>
          )}

          {/* Remember Me + Forgot */}
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
                    redirectTo: "http://localhost:3000"
                  })

                  setAuthSuccess("Password reset email sent.")
                }}
                className="text-blue-500 text-xs hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Error */}
          {authError && (
            <p className="text-red-500 text-sm">
              {authError}
            </p>
          )}

          {/* Success */}
          {authSuccess && (
            <p className="text-green-600 text-sm text-center">
              {authSuccess}
            </p>
          )}

          {/* Auth Button */}
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className={`
              w-full py-3 rounded-lg transition-all duration-200 font-medium
              ${!canSubmit
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : loading
                ? "bg-gray-400 text-white cursor-wait"
                : "bg-black text-white hover:bg-gray-800 active:scale-[0.98]"
              }
            `}

          >
            {loading // Loading 
              ? "Processing..."
              : isLogin
              ? "Login"
              : "Create Account"}
          </button>
          
          </form>
            {/* Toggle */}
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setAuthError(null) // Clear error when toggling
                setAuthSuccess(null) // Clear success message when toggling
              }}
              className="text-center text-sm text-gray-600 hover:text-black transition"
            >
              {isLogin
                ? "Don't have an account? Sign Up"
                : "Already have an account? Login"}
            </button>

          </div>
        </div>
      )
    }
