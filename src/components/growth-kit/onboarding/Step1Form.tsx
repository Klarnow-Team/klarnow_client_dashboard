'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProjectWithRelations, OnboardingStep } from '@/types/project'

interface Step1FormProps {
  project: ProjectWithRelations | null
  step: OnboardingStep | undefined
}

interface FormData {
  business_name: string
  name_and_role: string
  monthly_revenue_band: string
  where_operate: string
  current_website_url: string
  main_channels: string[]
  offer_name: string
  who_offer_for: string
  what_included: string
  how_deliver: string[]
  typical_timeline: string
  pricing_payment: string
  how_show_pricing: string
}

export default function GrowthKitStep1Form({ project, step }: Step1FormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const getStepData = () => {
    if (step?.fields) return step.fields
    
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      const onboardingData = localStorage.getItem(`onboarding_${user.kitType}`)
      if (onboardingData) {
        const onboarding = JSON.parse(onboardingData)
        const step1 = onboarding.steps?.find((s: any) => s.step_number === 1)
        if (step1?.fields) return step1.fields
      }
    }
    
    return {
      business_name: '',
      name_and_role: '',
      monthly_revenue_band: '',
      where_operate: '',
      current_website_url: '',
      main_channels: [],
      offer_name: '',
      who_offer_for: '',
      what_included: '',
      how_deliver: [],
      typical_timeline: '',
      pricing_payment: '',
      how_show_pricing: '',
    }
  }
  
  const [formData, setFormData] = useState<FormData>(getStepData())

  const requiredFields = [
    formData.business_name,
    formData.name_and_role,
    formData.monthly_revenue_band,
    formData.where_operate,
    formData.main_channels.length > 0,
    formData.offer_name,
    formData.who_offer_for,
    formData.what_included,
    formData.how_deliver.length > 0,
    formData.typical_timeline,
    formData.pricing_payment,
    formData.how_show_pricing,
  ]
  
  const completedCount = requiredFields.filter(Boolean).length
  const totalRequired = 12
  // Allow completion if at least 10 out of 12 fields are filled (more lenient)
  const isComplete = completedCount >= 10

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleChannel = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      main_channels: prev.main_channels.includes(channel)
        ? prev.main_channels.filter(c => c !== channel)
        : [...prev.main_channels, channel]
    }))
  }

  const toggleDelivery = (delivery: string) => {
    setFormData(prev => ({
      ...prev,
      how_deliver: prev.how_deliver.includes(delivery)
        ? prev.how_deliver.filter(d => d !== delivery)
        : [...prev.how_deliver, delivery]
    }))
  }

  const handleSave = async (continueToNext: boolean = false) => {
    setIsSaving(true)
    setError(null)

    try {
      const userData = localStorage.getItem('user')
      if (!userData) {
        throw new Error('User not found. Please log in again.')
      }

      const user = JSON.parse(userData)
      const kitType = user.kitType || user.kit_type || 'GROWTH'

      // Save to localStorage only
      const storageKey = `onboarding_${kitType}`
      const existingData = localStorage.getItem(storageKey)
      const onboardingData = existingData ? JSON.parse(existingData) : {
        steps: [],
        onboarding_percent: 0
      }

      const stepDataLocal = {
        id: `step-1-${Date.now()}`,
        step_number: 1,
        title: 'Snapshot and main offer',
        status: isComplete ? 'DONE' : 'IN_PROGRESS',
        required_fields_total: totalRequired,
        required_fields_completed: completedCount,
        time_estimate: 'About 8 minutes',
        fields: formData,
        started_at: step?.started_at || new Date().toISOString(),
        completed_at: isComplete ? new Date().toISOString() : null,
      }

      const stepIndex = onboardingData.steps.findIndex((s: any) => s.step_number === 1)
      if (stepIndex >= 0) {
        onboardingData.steps[stepIndex] = stepDataLocal
      } else {
        onboardingData.steps.push(stepDataLocal)
      }

      const totalRequiredFields = onboardingData.steps.reduce((sum: number, s: any) => sum + s.required_fields_total, 0)
      const totalCompletedFields = onboardingData.steps.reduce((sum: number, s: any) => sum + s.required_fields_completed, 0)
      onboardingData.onboarding_percent = totalRequiredFields > 0 
        ? Math.round((totalCompletedFields / totalRequiredFields) * 100)
        : 0

      localStorage.setItem(storageKey, JSON.stringify(onboardingData))

      if (continueToNext && isComplete) {
        router.push('/growth-kit/onboarding/step-2')
      } else {
        router.push('/growth-kit')
      }
    } catch (err: any) {
      setError(err.message)
      setIsSaving(false)
    }
  }

  if (!step) {
    return <div>Step not found</div>
  }

  const channelOptions = ['Instagram', 'LinkedIn', 'TikTok', 'YouTube', 'Email list', 'Paid ads', 'Other']
  const deliveryOptions = ['1:1', 'Group', 'Done for you', 'Hybrid', 'Self paced', 'Other']

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">
              Growth Kit – Step 1 of 3
            </h1>
            <p className="mt-2 text-lg text-black">
              Snapshot of your business and the main offer this funnel is built around.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="rounded-full bg-[#8359ee]/10 px-4 py-2 text-sm font-medium text-[#8359ee]">
              {step.time_estimate}
            </div>
            <div className="text-sm font-semibold text-black">
              Required fields {completedCount} / {totalRequired} complete
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm font-medium text-black mb-2">
            <span>Step 1 – Snapshot and main offer</span>
            <span className="font-semibold">{Math.round((completedCount / totalRequired) * 100)}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#8359ee] transition-all duration-300"
              style={{ width: `${(completedCount / totalRequired) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card A: Business snapshot */}
            <div className="rounded-lg bg-white p-8 shadow-md border border-gray-100">
              <h2 className="mb-6 text-xl font-bold text-black">
                Business snapshot
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Business name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.business_name}
                    onChange={(e) => updateField('business_name', e.target.value)}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                    placeholder="Your business name"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    How your business name should appear across the funnel.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Your name and role <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name_and_role}
                    onChange={(e) => updateField('name_and_role', e.target.value)}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                    placeholder="For example: Goodness Olawale, Founder"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    For example: Goodness Olawale, Founder.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Monthly revenue band <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.monthly_revenue_band}
                    onChange={(e) => updateField('monthly_revenue_band', e.target.value)}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  >
                    <option value="">Select revenue band...</option>
                    <option value="Under £10K">Under £10K</option>
                    <option value="£10K to £20K">£10K to £20K</option>
                    <option value="£20K to £35K">£20K to £35K</option>
                    <option value="£35K to £50K">£35K to £50K</option>
                    <option value="Over £50K">Over £50K</option>
                  </select>
                  <p className="mt-2 text-sm text-gray-600">
                    A rough range so we understand your stage.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Where you operate <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.where_operate}
                    onChange={(e) => updateField('where_operate', e.target.value)}
                    rows={3}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                    placeholder="Cities, regions or countries you serve..."
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    Cities, regions or countries you serve.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Current website URL
                  </label>
                  <input
                    type="url"
                    value={formData.current_website_url}
                    onChange={(e) => updateField('current_website_url', e.target.value)}
                    placeholder="https://..."
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Main channels <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {channelOptions.map((channel) => (
                      <label key={channel} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.main_channels.includes(channel)}
                          onChange={() => toggleChannel(channel)}
                          className="h-4 w-4 rounded border-gray-300 text-[#8359ee] focus:ring-[#8359ee]"
                        />
                        <span className="text-sm text-black">{channel}</span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Tick where you actually show up right now.
                  </p>
                </div>
              </div>
            </div>

            {/* Card B: The offer we are backing */}
            <div className="rounded-lg bg-white p-8 shadow-md border border-gray-100">
              <h2 className="mb-6 text-xl font-bold text-black">
                The offer we are backing
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Offer name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.offer_name}
                    onChange={(e) => updateField('offer_name', e.target.value)}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                    placeholder="Name of your main offer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Who this offer is for <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.who_offer_for}
                    onChange={(e) => updateField('who_offer_for', e.target.value)}
                    rows={3}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                    placeholder="Describe your best fit client for this offer..."
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    Describe your best fit client for this offer.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    What is included <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.what_included}
                    onChange={(e) => updateField('what_included', e.target.value)}
                    rows={4}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                    placeholder="Modules, sessions, deliverables, support..."
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    Modules, sessions, deliverables, support.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    How you deliver it <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {deliveryOptions.map((delivery) => (
                      <label key={delivery} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.how_deliver.includes(delivery)}
                          onChange={() => toggleDelivery(delivery)}
                          className="h-4 w-4 rounded border-gray-300 text-[#8359ee] focus:ring-[#8359ee]"
                        />
                        <span className="text-sm text-black">{delivery}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Typical timeline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.typical_timeline}
                    onChange={(e) => updateField('typical_timeline', e.target.value)}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                    placeholder="For example: 12 week programme, 6 month retainer"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    For example: 12 week programme, 6 month retainer.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Pricing and payment options <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.pricing_payment}
                    onChange={(e) => updateField('pricing_payment', e.target.value)}
                    rows={3}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                    placeholder="Describe pricing and payment options..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    How to show pricing <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.how_show_pricing}
                    onChange={(e) => updateField('how_show_pricing', e.target.value)}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  >
                    <option value="">Select option...</option>
                    <option value="Full prices">Full prices</option>
                    <option value="From £X">From £X</option>
                    <option value="No prices shown">No prices shown</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Guidance */}
          <div className="space-y-6">
            <div className="rounded-lg bg-[#8359ee]/10 p-6 border-2 border-[#8359ee]/20">
              <h3 className="text-base font-bold text-black mb-3">Why this step matters</h3>
              <p className="text-sm text-black leading-relaxed">
                This step tells Klaro what we are really selling and who it is for. Once this is done, we can plan your funnel around a single clear offer instead of trying to sell everything at once.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-6 border-2 border-gray-200">
              <h3 className="text-base font-bold text-black mb-3">Required to continue</h3>
              <p className="text-sm text-black mb-3">
                To unlock Step 2, please complete:
              </p>
              <ul className="list-inside list-disc text-sm text-black space-y-2 mb-3">
                <li>Business name</li>
                <li>Your name and role</li>
                <li>Monthly revenue band</li>
                <li>Locations</li>
                <li>Main channels</li>
                <li>Offer name</li>
                <li>Who it is for</li>
                <li>What is included</li>
                <li>How you deliver it</li>
                <li>Typical timeline</li>
                <li>Pricing and payment</li>
                <li>How to show pricing</li>
              </ul>
              <p className="text-sm font-semibold text-black">
                Required fields complete: {completedCount} of {totalRequired}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-6 border-2 border-green-100">
              <h3 className="text-base font-bold text-black mb-3">Next from us</h3>
              <p className="text-sm text-black leading-relaxed">
                Once Step 1 is complete, we will review your answers and start shaping your funnel plan.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-10 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 pt-8">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-400"
          >
            {isSaving ? 'Saving...' : 'Save and come back later'}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving || !isComplete}
            className="rounded-full bg-[#8359ee] px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#8359ee]/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#8359ee] hover:shadow-lg transform hover:-translate-y-0.5"
          >
            {isSaving ? 'Saving...' : 'Save and continue to Step 2'}
          </button>
        </div>

        {!isComplete && (
          <div className="mt-6 rounded-full bg-yellow-50 border border-yellow-200 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-sm font-medium text-black">
              Please complete the required fields marked with *.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

