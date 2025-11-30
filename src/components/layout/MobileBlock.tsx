'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function MobileBlock({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const checkMobile = () => {
      // Check if screen width is less than 768px (tablet breakpoint)
      const isMobileDevice = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(isMobileDevice)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Don't show mobile message during SSR
  if (!isMounted) {
    return <>{children}</>
  }

  if (isMobile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <Image
              src="/klarnow.svg"
              alt="Klarnow"
              width={80}
              height={24}
              className="h-30 w-30 -mt-80"
              priority
            />
          </div>
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Please use a PC
          </h1>
          <p className="text-base text-gray-600">
            This dashboard is optimized for desktop and laptop computers. Please access it from a PC for the best experience.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

