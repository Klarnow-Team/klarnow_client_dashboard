'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMockAuth } from '@/hooks/useMockAuth'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function TasksPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useMockAuth()

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

  if (!isAuthenticated) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black">Tasks</h1>
            <p className="text-lg text-gray-600 mt-2">
              View and manage your project tasks and to-dos.
            </p>
          </div>
          
          <div className="rounded-2xl bg-white p-8 border-2 border-gray-200/60">
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-[#8359ee]/10 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#8359ee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">No current tasks</h3>
              <p className="text-gray-600">
                You don't have any tasks at the moment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

