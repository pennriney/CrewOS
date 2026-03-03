import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'CrewOS — Painting Crew Management',
  description: 'Manage your painting crews, jobs, and schedules intelligently.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 px-4 py-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </body>
    </html>
  )
}
