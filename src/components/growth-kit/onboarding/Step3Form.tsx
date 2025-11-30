'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProjectWithRelations, OnboardingStep } from '@/types/project'
import Link from 'next/link'

interface Step3FormProps {
  project: ProjectWithRelations | null
  step: OnboardingStep | undefined
}

interface FormData {
  current_site_platform: string
  how_get_site_access: string
  domain_registered: string
  how_get_dns_access: string
  email_platform: string
  how_get_email_access: string
  booking_link: string
  use_crm: string
  crm_details: string
  tracking_ads: string[]
  privacy_policy_link: string
  terms_conditions_link: string
  required_disclaimers: string
  who_makes_decisions: string
  secondary_contact: string
  preferred_communication: string
  review_speed: string
  dates_offline: string
  main_traffic_focus: string[]
}

export default function GrowthKitStep3Form({ project, step }: Step3FormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  
  const getStepData = () => {
    if (step?.fields) return step.fields
    
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      const onboardingData = localStorage.getItem(`onboarding_${user.kitType}`)
      if (onboardingData) {
        const onboarding = JSON.parse(onboardingData)
        const step3 = onboarding.steps?.find((s: any) => s.step_number === 3)
        if (step3?.fields) return step3.fields
      }
    }
    
    return {
      current_site_platform: '',
      how_get_site_access: '',
      domain_registered: '',
      how_get_dns_access: '',
      email_platform: '',
      how_get_email_access: '',
      booking_link: '',
      use_crm: '',
      crm_details: '',
      tracking_ads: [],
      privacy_policy_link: '',
      terms_conditions_link: '',
      required_disclaimers: '',
      who_makes_decisions: '',
      secondary_contact: '',
      preferred_communication: '',
      review_speed: '',
      dates_offline: '',
      main_traffic_focus: [],
    }
  }
  
  const [formData, setFormData] = useState<FormData>(getStepData())

  const requiredFields = [
    formData.current_site_platform,
    formData.how_get_site_access,
    formData.domain_registered,
    formData.how_get_dns_access,
    formData.email_platform,
    formData.how_get_email_access,
    formData.booking_link,
    formData.tracking_ads.length > 0,
    formData.privacy_policy_link,
    formData.who_makes_decisions,
    formData.preferred_communication,
    formData.review_speed,
    formData.main_traffic_focus.length > 0,
  ]
  
  const completedCount = requiredFields.filter(Boolean).length
  const totalRequired = 13 // Total number of required fields
  // Allow saving if at least 10 out of 13 fields are filled (more lenient for saving)
  const formIsComplete = completedCount >= 10
  // But require ALL 13 fields to be filled to enable "Finish onboarding" button
  const allFieldsComplete = completedCount === totalRequired

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleTracking = (tracking: string) => {
    setFormData(prev => ({
      ...prev,
      tracking_ads: prev.tracking_ads.includes(tracking)
        ? prev.tracking_ads.filter(t => t !== tracking)
        : [...prev.tracking_ads, tracking]
    }))
  }

  const toggleTrafficFocus = (focus: string) => {
    setFormData(prev => ({
      ...prev,
      main_traffic_focus: prev.main_traffic_focus.includes(focus)
        ? prev.main_traffic_focus.filter(f => f !== focus)
        : [...prev.main_traffic_focus, focus]
    }))
  }

  const handleFinish = async () => {
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
        id: `step-3-${Date.now()}`,
        step_number: 3,
        title: 'Systems and launch',
        status: allFieldsComplete ? 'DONE' : 'IN_PROGRESS',
        required_fields_total: totalRequired,
        required_fields_completed: completedCount,
        time_estimate: 'About 7 minutes',
        fields: formData,
        started_at: step?.started_at || new Date().toISOString(),
        completed_at: allFieldsComplete ? new Date().toISOString() : null,
      }

      const stepIndex = onboardingData.steps.findIndex((s: any) => s.step_number === 3)
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

      if (allFieldsComplete) {
        // Mark onboarding as finished in localStorage
        onboardingData.onboarding_finished = true
        localStorage.setItem(storageKey, JSON.stringify(onboardingData))
        
        // Update local storage user data
        const updatedUser = { ...user, onboarding_finished: true }
        localStorage.setItem('user', JSON.stringify(updatedUser))

        // Save all 3 steps to Supabase
        try {
          const allSteps = onboardingData.steps || []
          
          // Ensure we have all 3 steps
          if (allSteps.length === 3) {
            const email = user.email || user.email_address
            if (!email) {
              throw new Error('Email not found. Please log in again.')
            }

            const response = await fetch('/api/onboarding/complete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email,
                kit_type: kitType,
                steps: allSteps.map((s: any) => ({
                  step_number: s.step_number,
                  title: s.title,
                  status: s.status,
                  required_fields_total: s.required_fields_total,
                  required_fields_completed: s.required_fields_completed,
                  time_estimate: s.time_estimate,
                  fields: s.fields,
                  started_at: s.started_at,
                  completed_at: s.completed_at || (s.status === 'DONE' ? new Date().toISOString() : null)
                }))
              }),
            })

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Failed to save onboarding' }))
              console.error('Failed to save onboarding to database:', errorData)
              // Don't block success - data is saved in localStorage
              // Just log the error
            } else {
              console.log('Onboarding saved to database successfully!')
            }
          } else {
            console.warn('Not all 3 steps found in localStorage, skipping database save')
          }
        } catch (dbError: any) {
          console.error('Error saving to database:', dbError)
          // Don't block success - data is saved in localStorage
        }

        // Show success state only when all fields are complete
        setIsComplete(true)
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

  const sitePlatformOptions = ['WordPress', 'Squarespace', 'Wix', 'Shopify', 'Webflow', 'Custom', 'Other']
  const domainProviderOptions = ['GoDaddy', 'Namecheap', 'Google Domains', 'Cloudflare', 'Other']
  const emailPlatformOptions = ['Mailchimp', 'ConvertKit', 'Kajabi', 'ActiveCampaign', 'Other']
  const crmOptions = ['None', 'HubSpot', 'Pipedrive', 'Close', 'Other']
  const trackingOptions = ['Google Analytics', 'Google Tag Manager', 'Meta Ads', 'LinkedIn Ads', 'Google Ads', 'Other']
  const communicationOptions = ['Email', 'WhatsApp', 'Slack', 'Other']
  const reviewSpeedOptions = ['Within 24 hours', 'Within 48 hours', 'Within 3 days']
  const trafficFocusOptions = ['Instagram', 'LinkedIn', 'Email list', 'Paid ads', 'SEO', 'Other']

  // Success state - only show when ALL fields are complete
  if (isComplete && allFieldsComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white p-12 shadow-md border border-gray-100 text-center">
            <div className="mb-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-black mb-4">Growth Kit onboarding complete</h1>
            <p className="text-lg text-black mb-6">
              You have finished all three steps. Klaro now has what it needs to build your funnel.
            </p>
            <p className="text-base text-black mb-8">
              Look at your Growth Kit dashboard to see what we are working on next.
            </p>
            <Link
              href="/growth-kit"
              className="inline-block rounded-lg bg-[#8359ee] px-8 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#8359ee]/90 transition-all"
            >
              Go to Growth Kit Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">
              Growth Kit – Step 3 of 3
            </h1>
            <p className="mt-2 text-lg text-black">
              Website, email, tracking and how we will work together.
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
            <span>Step 3 – Systems and launch</span>
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
            {/* Card A: Website and domain */}
            <div className="rounded-lg bg-white p-8 shadow-md border border-gray-100">
              <h2 className="mb-6 text-xl font-bold text-black">
                Website and domain
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    What your current site is built on <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.current_site_platform}
                    onChange={(e) => updateField('current_site_platform', e.target.value)}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  >
                    <option value="">Select platform...</option>
                    {sitePlatformOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    How we get access to your site <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.how_get_site_access}
                    onChange={(e) => updateField('how_get_site_access', e.target.value)}
                    rows={4}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                    placeholder="Describe how we can access your site..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Where your domain is registered <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.domain_registered}
                    onChange={(e) => updateField('domain_registered', e.target.value)}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  >
                    <option value="">Select provider...</option>
                    {domainProviderOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    How we get DNS access or a tech contact <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.how_get_dns_access}
                    onChange={(e) => updateField('how_get_dns_access', e.target.value)}
                    rows={4}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                    placeholder="Describe how we can get DNS access..."
                  />
                </div>
              </div>
            </div>

            {/* Card B: Email, booking and CRM */}
            <div className="rounded-lg bg-white p-8 shadow-md border border-gray-100">
              <h2 className="mb-6 text-xl font-bold text-black">
                Email, booking and CRM
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Email platform <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.email_platform}
                    onChange={(e) => updateField('email_platform', e.target.value)}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  >
                    <option value="">Select platform...</option>
                    {emailPlatformOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    How we get email platform access <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.how_get_email_access}
                    onChange={(e) => updateField('how_get_email_access', e.target.value)}
                    rows={4}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                    placeholder="Describe how we can access your email platform..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Booking link or system <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.booking_link}
                    onChange={(e) => updateField('booking_link', e.target.value)}
                    placeholder="https://..."
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Do you use a CRM
                  </label>
                  <select
                    value={formData.use_crm}
                    onChange={(e) => updateField('use_crm', e.target.value)}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  >
                    <option value="">Select option...</option>
                    {crmOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {formData.use_crm && formData.use_crm !== 'None' && (
                    <textarea
                      value={formData.crm_details}
                      onChange={(e) => updateField('crm_details', e.target.value)}
                      rows={3}
                      placeholder="Details and access notes..."
                      className="mt-2 block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Card C: Tracking and policies */}
            <div className="rounded-lg bg-white p-8 shadow-md border border-gray-100">
              <h2 className="mb-6 text-xl font-bold text-black">
                Tracking and policies
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    What tracking and ads you use now <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {trackingOptions.map((tracking) => (
                      <label key={tracking} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.tracking_ads.includes(tracking)}
                          onChange={() => toggleTracking(tracking)}
                          className="h-4 w-4 rounded border-gray-300 text-[#8359ee] focus:ring-[#8359ee]"
                        />
                        <span className="text-sm text-black">{tracking}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Privacy policy link <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.privacy_policy_link}
                    onChange={(e) => updateField('privacy_policy_link', e.target.value)}
                    placeholder="https://..."
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Terms and conditions link
                  </label>
                  <input
                    type="url"
                    value={formData.terms_conditions_link}
                    onChange={(e) => updateField('terms_conditions_link', e.target.value)}
                    placeholder="https://..."
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Any required disclaimers
                  </label>
                  <textarea
                    value={formData.required_disclaimers}
                    onChange={(e) => updateField('required_disclaimers', e.target.value)}
                    rows={3}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                    placeholder="List any required disclaimers..."
                  />
                </div>
              </div>
            </div>

            {/* Card D: How we work together */}
            <div className="rounded-lg bg-white p-8 shadow-md border border-gray-100">
              <h2 className="mb-6 text-xl font-bold text-black">
                How we work together
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Who makes final decisions <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.who_makes_decisions}
                    onChange={(e) => updateField('who_makes_decisions', e.target.value)}
                    placeholder="Name and role"
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Secondary contact
                  </label>
                  <input
                    type="text"
                    value={formData.secondary_contact}
                    onChange={(e) => updateField('secondary_contact', e.target.value)}
                    placeholder="Name and contact details"
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Preferred communication channel <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.preferred_communication}
                    onChange={(e) => updateField('preferred_communication', e.target.value)}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  >
                    <option value="">Select channel...</option>
                    {communicationOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    How quickly you can usually review work <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.review_speed}
                    onChange={(e) => updateField('review_speed', e.target.value)}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  >
                    <option value="">Select speed...</option>
                    {reviewSpeedOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Any dates in the next 14 days where you are offline
                  </label>
                  <textarea
                    value={formData.dates_offline}
                    onChange={(e) => updateField('dates_offline', e.target.value)}
                    rows={3}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                    placeholder="List dates or date ranges..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Main traffic focus after launch <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {trafficFocusOptions.map((focus) => (
                      <label key={focus} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.main_traffic_focus.includes(focus)}
                          onChange={() => toggleTrafficFocus(focus)}
                          className="h-4 w-4 rounded border-gray-300 text-[#8359ee] focus:ring-[#8359ee]"
                        />
                        <span className="text-sm text-black">{focus}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Guidance */}
          <div className="space-y-6">
            <div className="rounded-lg bg-[#8359ee]/10 p-6 border-2 border-[#8359ee]/20">
              <h3 className="text-base font-bold text-black mb-3">Why this step matters</h3>
              <p className="text-sm text-black leading-relaxed">
                This is the part that connects everything. Your answers here let us plug the funnel into your website, email platform, booking link and tracking so you can see what is working.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-6 border-2 border-gray-200">
              <h3 className="text-base font-bold text-black mb-3">Required to finish</h3>
              <p className="text-sm text-black mb-3">
                To finish Growth Kit onboarding, please complete:
              </p>
              <ul className="list-inside list-disc text-sm text-black space-y-2 mb-3">
                <li>Website platform and access</li>
                <li>Domain provider and DNS access</li>
                <li>Email platform and access</li>
                <li>Booking link</li>
                <li>Tracking and ads used</li>
                <li>Privacy policy link</li>
                <li>Main decision maker</li>
                <li>Communication channel</li>
                <li>Review speed</li>
                <li>Main traffic focus</li>
              </ul>
              <p className="text-sm font-semibold text-black">
                Required fields complete: {completedCount} of {totalRequired}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-6 border-2 border-green-100">
              <h3 className="text-base font-bold text-black mb-3">Next from us</h3>
              <p className="text-sm text-black leading-relaxed">
                Once Step 3 is complete, we can start building and wiring your funnel. You will see your project status update on the Home screen.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-10 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 pt-8">
          <Link
            href="/growth-kit/onboarding/step-2"
            className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-gray-50 transition-all duration-200 text-center hover:border-gray-400"
          >
            Back to Step 2
          </Link>
          <button
            type="button"
            onClick={handleFinish}
            disabled={isSaving || !allFieldsComplete}
            className={`rounded-full px-8 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 ${
              allFieldsComplete
                ? 'bg-[#8359ee] hover:bg-[#8359ee]/90'
                : 'bg-gray-400 cursor-not-allowed opacity-60'
            } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSaving ? 'Saving...' : 'Finish onboarding'}
          </button>
        </div>

        {!allFieldsComplete && (
          <div className="mt-6 rounded-full bg-yellow-50 border border-yellow-200 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-sm font-medium text-black">
              Please complete all required fields marked with * to finish onboarding. ({completedCount} of {totalRequired} complete)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

