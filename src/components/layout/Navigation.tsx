'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMockAuth } from '@/hooks/useMockAuth'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useMockAuth()

  const handleSignOut = () => {
    signOut()
    router.push('/')
    router.refresh()
  }

  const navItems = [
    { href: '/home', label: 'Home', subtitle: 'Your project with Klarnow in one place.' },
    ...(user?.kitType === 'LAUNCH' ? [{
      href: '/launch-kit',
      label: 'Launch Kit',
      subtitle: '3 page high trust site in 14 days.'
    }] : []),
    ...(user?.kitType === 'GROWTH' ? [{
      href: '/growth-kit',
      label: 'Growth Kit',
      subtitle: '4 to 6 page funnel and emails in 14 days.'
    }] : []),
    { href: '/support', label: 'Support', subtitle: 'Messages, Looms and updates from the Klarnow team.' }
  ]

  // Don't show navigation on login page
  if (pathname === '/') {
    return null
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/home" className="text-xl font-bold text-gray-900">
              Klarnow
            </Link>
            <div className="flex space-x-1">
              {navItems.map((item) => {
                const isActive = pathname?.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#8359ee]/10 text-[#8359ee]'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
}

