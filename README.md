# LedgerOne

LedgerOne is a full-stack SaaS invoice management platform built with Next.js and Supabase.

## 🚀 Features

- Email & password authentication
- Protected dashboard routes
- Secure Row-Level Security (RLS)
- Invoice CRUD functionality
- Real-time status updates
- Modern responsive UI

## 🏗 Tech Stack

- Next.js (App Router)
- TypeScript
- Supabase (Auth + PostgreSQL)
- Tailwind CSS

## 📌 Roadmap

- Free & Pro subscription tiers
- Stripe integration
- Usage-based feature gating
- Analytics dashboard
- Dark / Light theme toggle
- Deployment on Vercel

## 🔐 Authentication & Security

LedgerOne uses Supabase Authentication with the following security rules:

- Minimum password length: 10 characters
- Requires at least:
  - 1 uppercase letter
  - 1 lowercase letter
  - 1 number
  - 1 special character
- Email verification required on signup
- Anti-email enumeration messaging to prevent account discovery

Password strength is calculated client-side and visually displayed during signup.

---

Built and maintained by Daniel J Seog.
