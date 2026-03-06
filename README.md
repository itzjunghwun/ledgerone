# LedgerOne

LedgerOne is a full-stack SaaS invoice management platform built with Next.js and Supabase.

It allows users to securely authenticate, create invoices, manage payment status, and operate inside a clean, modern dashboard interface.

---

## 🚀 Features

- Email & password authentication
- Protected dashboard routes
- Secure Row-Level Security (RLS)
- Invoice CRUD functionality
- Real-time status updates
- Modern responsive UI
- Class-based Dark Mode system
- Appearance settings dropdown (for now)
- Enter-key form submission for login
- Client-side password strength validation

---

## 🌙 Appearance System

LedgerOne uses a class-based dark mode implementation with Tailwind CSS:

- `darkMode: 'class'`
- Controlled via `document.documentElement.classList`
- Appearance toggle located inside a Settings dropdown
- Proper `color-scheme` handling to prevent browser auto-dark form rendering

---

## 🔐 Authentication & Security

LedgerOne uses Supabase Authentication with the following security rules:

### Password Requirements
- Minimum length: 10 characters
- At least:
  - 1 uppercase letter
  - 1 lowercase letter
  - 1 number
  - 1 special character

### Additional Security
- Email verification required on signup
- Anti-email enumeration messaging to prevent account discovery
- Row-Level Security (RLS) enforced at database level
- Automatic redirect if user is authenticated
- Secure logout handling

Password strength is calculated client-side and visually displayed during signup.

---

## 🏗 Tech Stack

- **Frontend:** Next.js (App Router)
- **Language:** TypeScript
- **Database & Auth:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **State Management:** React Hooks
- **Routing:** Next.js App Router

---

## 📂 Project Structure
src/
├── app/
│ ├── dashboard/
│ ├── login/
│ ├── layout.tsx
│ └── page.tsx
├── components/
│ ├── AppNavbar.tsx
│ └── Navbar.tsx
└── lib/
└── supabase.ts

---

## 📌 Roadmap

- Free & Pro subscription tiers
- Stripe integration
- Usage-based feature gating
- Analytics dashboard
- Recurring invoices
- Email reminders
- Deployment on Vercel

---

## 👤 Author

Built and maintained by **Daniel J. Seog**
