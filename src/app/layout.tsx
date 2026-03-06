'use client'

import './globals.css'
import { useEffect, useState } from 'react'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}