'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMockAuth } from '@/hooks/useMockAuth'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function SettingsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useMockAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-black font-medium">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black">Settings</h1>
            <p className="text-lg text-gray-600 mt-2">
              Manage your account settings and preferences.
            </p>
          </div>
          
          <div className="space-y-6">
            {/* Account Information */}
            <div className="rounded-2xl bg-white p-8 shadow-lg border-2 border-gray-200/60">
              <h2 className="text-2xl font-bold text-black mb-6">Account Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="text-base text-gray-900">
                    {user.email || user.email_address || 'Not available'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kit Type
                  </label>
                  <div className="text-base text-gray-900">
                    {user.kitType || user.kit_type || 'Not available'}
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="rounded-2xl bg-white p-8 shadow-lg border-2 border-gray-200/60">
              <h2 className="text-2xl font-bold text-black mb-6">Preferences</h2>
              <div className="text-center py-8">
                <p className="text-gray-600">
                  Additional settings and preferences coming soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

