'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '⬡' },
  { href: '/schedule', label: 'Schedule', icon: '📅' },
  { href: '/jobs', label: 'Jobs', icon: '🏠' },
  { href: '/employees', label: 'Employees', icon: '👥' },
  { href: '/outcomes', label: 'Outcomes', icon: '✓' },
  { href: '/insights', label: 'Insights', icon: '◈' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-sky-600">CrewOS</span>
            <span className="text-xs text-gray-400 font-medium hidden sm:block">Painting</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ href, label, icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${active
                      ? 'bg-sky-50 text-sky-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <span className="hidden sm:inline text-base leading-none">{icon}</span>
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
