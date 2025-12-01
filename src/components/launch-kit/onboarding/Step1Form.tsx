'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProjectWithRelations, OnboardingStep } from '@/types/project'
import { fetchQuizSubmission, mapQuizToOnboardingFields } from '@/utils/fetchQuizSubmission'
import { mergeQuizDataWithFormData } from '@/utils/onboarding-save'

interface Step1FormProps {
  project: ProjectWithRelations | null
  step: OnboardingStep | undefined
}

interface FormData {
  business_name: string
  name_and_role: string
  contact_email: string
  phone_whatsapp: string
  social_links: Array<{ platform: string; url: string }>
  what_you_sell: string
  who_is_this_for: string
}

export default function LaunchKitStep1Form({ project, step }: Step1FormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Get step data - merge existing step.fields with base empty form structure
  // This ensures all required fields exist even if step.fields is incomplete
  const getStepData = () => {
    // Base empty form structure with all required fields
    const baseForm: FormData = {
      business_name: '',
      name_and_role: '',
      contact_email: '',
      phone_whatsapp: '',
      social_links: [{ platform: '', url: '' }],
      what_you_sell: '',
      who_is_this_for: '',
    }
    
    // If step.fields exists, merge it with base form
    // This ensures all fields are present even if step.fields is incomplete
    if (step?.fields && typeof step.fields === 'object') {
      return { ...baseForm, ...step.fields }
    }
    
    // Otherwise return base empty form - quiz data will pre-fill via useEffect
    return baseForm
  }
  
  const [formData, setFormData] = useState<FormData>(getStepData())
  const [isLoadingQuizData, setIsLoadingQuizData] = useState(true)

  // Fetch and pre-fill quiz submission data from Supabase on mount
  useEffect(() => {
    const loadQuizData = async () => {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return

        const user = JSON.parse(userData)
        
        // Prefer ID over email for accuracy
        const quizSubmissionId = user.quiz_submission_id
        const userEmail = user.email || user.email_address

        if (!quizSubmissionId && !userEmail) {
          console.warn('No quiz submission ID or email found in user data')
          return
        }

        console.log('Fetching quiz submission:', {
          id: quizSubmissionId || 'not provided',
          email: userEmail || 'not provided'
        })

        // Fetch by ID (preferred) or email (fallback)
        const quizSubmission = await fetchQuizSubmission(quizSubmissionId, userEmail)
        
        if (quizSubmission) {
          console.log('Quiz submission loaded successfully:', {
            id: quizSubmission.id,
            email: quizSubmission.email,
            name: quizSubmission.full_name
          })
        }
        
        if (quizSubmission) {
          // Map quiz data to onboarding fields based on LAUNCH kit
          const mappedFields = mapQuizToOnboardingFields(quizSubmission, 'LAUNCH')
          
          // Pre-fill all matching fields from quiz submission
          // Use merge utility to ensure prefilled data overwrites empty strings
          setFormData(prev => {
            const merged = mergeQuizDataWithFormData(prev, mappedFields, true) as FormData
            console.log('[Step1] Pre-filled form fields from quiz submission:', {
              mappedFields: Object.keys(mappedFields),
              mergedFields: Object.keys(merged),
              sampleMerged: {
                business_name: merged.business_name,
                name_and_role: merged.name_and_role,
                contact_email: merged.contact_email
              }
            })
            return merged
          })
          
          // Note: Prefilled data is now in formData state
          // When handleSave is called, it will save all fields including prefilled ones
          console.log('[Step1] Prefilled data loaded and ready to save:', Object.keys(mappedFields))
        }
      } catch (error) {
        console.error('Error loading quiz data from Supabase:', error)
      } finally {
        setIsLoadingQuizData(false)
      }
    }

    loadQuizData()
  }, [])

  // Calculate completed required fields
  const requiredFields = [
    formData.business_name,
    formData.name_and_role,
    formData.contact_email,
    formData.phone_whatsapp,
    formData.social_links.some(link => link.platform && link.url),
    formData.what_you_sell,
    formData.who_is_this_for,
  ]
  
  const completedCount = requiredFields.filter(Boolean).length
  const totalRequired = 7
  // Allow completion if at least 6 out of 7 fields are filled (more lenient)
  const isComplete = completedCount >= 6

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addSocialLink = () => {
    setFormData(prev => ({
      ...prev,
      social_links: [...prev.social_links, { platform: '', url: '' }]
    }))
  }

  const removeSocialLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      social_links: prev.social_links.filter((_, i) => i !== index)
    }))
  }

  const updateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: prev.social_links.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      )
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
      const kitType = user.kitType || user.kit_type || 'LAUNCH'

      // Save to localStorage only
      const storageKey = `onboarding_${kitType}`
      const existingData = localStorage.getItem(storageKey)
      const onboardingData = existingData ? JSON.parse(existingData) : {
        steps: [],
        onboarding_percent: 0
      }

      // Before saving, ensure prefilled quiz data is merged (in case it wasn't loaded yet)
      // This ensures all prefilled fields are included even if user saves quickly
      let allFields = { ...formData }
      
      // Re-fetch and merge quiz data to ensure nothing is missing
      try {
        const userData = localStorage.getItem('user')
        if (userData) {
          const user = JSON.parse(userData)
          const quizSubmissionId = user.quiz_submission_id
          const userEmail = user.email || user.email_address
          
          if (quizSubmissionId || userEmail) {
            const quizSubmission = await fetchQuizSubmission(quizSubmissionId, userEmail)
            if (quizSubmission) {
              const mappedFields = mapQuizToOnboardingFields(quizSubmission, kitType)
              // Merge quiz data, but preserve user edits
              allFields = mergeQuizDataWithFormData(allFields, mappedFields, true) as FormData
              console.log('[Step1] Re-merged quiz data before saving')
            }
          }
        }
      } catch (error) {
        console.warn('[Step1] Could not re-merge quiz data before saving:', error)
        // Continue with current formData if merge fails
      }
      
      console.log('[Step1] Saving all fields to localStorage:', {
        fieldCount: Object.keys(allFields).length,
        fields: Object.keys(allFields),
        hasPrefilledData: Object.values(allFields).some(v => v && v !== '' && (Array.isArray(v) ? v.length > 0 : true)),
        sampleFields: {
          business_name: allFields.business_name,
          name_and_role: allFields.name_and_role,
          contact_email: allFields.contact_email
        }
      })
      
      const stepDataLocal = {
        id: `step-1-${Date.now()}`,
        step_number: 1,
        title: 'Tell us who you are',
        status: isComplete ? 'DONE' : 'IN_PROGRESS',
        required_fields_total: totalRequired,
        required_fields_completed: completedCount,
        time_estimate: 'About 5 minutes',
        fields: allFields, // Save ALL fields including prefilled ones
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
        router.push('/launch-kit/onboarding/step-2')
      } else {
        router.push('/launch-kit')
      }
    } catch (err: any) {
      setError(err.message)
      setIsSaving(false)
    }
  }

  if (!step) {
    return <div>Step not found</div>
  }

  return (
    <div className="min-h-screen bg-white py-8 transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <h1 className="text-3xl font-bold text-black">
              Launch Kit – Step 1 of 3
            </h1>
            <p className="mt-2 text-lg text-gray-700">
              Tell us who you are and what you sell. This gives us the basics to start.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="rounded-full bg-[#8359ee]/10 px-4 py-2 text-sm font-medium text-[#8359ee] shadow-sm">
              {step.time_estimate}
            </div>
            <div className="text-sm font-semibold text-black">
              Required fields {completedCount} / {totalRequired} complete
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 rounded-xl bg-white p-5 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between text-sm font-medium text-black mb-3">
            <span>Step 1 – Tell us who you are</span>
            <span className="font-semibold text-[#8359ee]">{Math.round((completedCount / totalRequired) * 100)}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#8359ee] transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${(completedCount / totalRequired) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-full bg-red-50 p-4 border border-red-200 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card: About you and your business */}
            <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
              <h2 className="mb-6 text-xl font-bold text-black">
                About you and your business
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
                    className="mt-1 block w-full rounded-full border border-gray-300 px-4 py-3 text-black bg-white transition-all duration-200 focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm hover:border-gray-400"
                    placeholder="Your business name"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    Exactly how you want it on the site.
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
                    className="mt-1 block w-full rounded-full border border-gray-300 px-4 py-3 text-black bg-white transition-all duration-200 focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm hover:border-gray-400"
                    placeholder="For example: Goodness Olawale, Founder"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    For example: Goodness Olawale, Founder.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Best contact email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => updateField('contact_email', e.target.value)}
                    className="mt-1 block w-full rounded-full border border-gray-300 px-4 py-3 text-black bg-white transition-all duration-200 focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm hover:border-gray-400"
                    placeholder="your@email.com"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    We use this for project updates and contact form enquiries.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Phone or WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone_whatsapp}
                    onChange={(e) => updateField('phone_whatsapp', e.target.value)}
                    className="mt-1 block w-full rounded-full border border-gray-300 px-4 py-3 text-black bg-white transition-all duration-200 focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm hover:border-gray-400"
                    placeholder="+1234567890"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    Only used for project communication. We will not show it on the site unless you say yes.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Main social profiles <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {formData.social_links.map((link, index) => (
                      <div key={index} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                        <select
                          value={link.platform}
                          onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                          className="block w-40 rounded-full border border-gray-300 px-4 py-3 text-black bg-white transition-all duration-200 focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm hover:border-gray-400"
                        >
                          <option value="">Platform</option>
                          <option value="Instagram">Instagram</option>
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="Twitter">Twitter</option>
                          <option value="Facebook">Facebook</option>
                          <option value="Other">Other</option>
                        </select>
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                          className="flex-1 rounded-full border border-gray-300 px-4 py-3 text-black bg-white transition-all duration-200 focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm hover:border-gray-400"
                          placeholder="https://..."
                        />
                        {formData.social_links.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSocialLink(index)}
                            className="rounded-full bg-red-50 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-100 transition-all duration-200 border border-red-200 hover:border-red-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addSocialLink}
                    className="mt-3 text-sm font-medium text-[#8359ee] hover:text-[#8359ee]/80 transition-colors duration-200"
                  >
                    + Add another social profile
                  </button>
                  <p className="mt-2 text-sm text-gray-600">
                    Instagram, LinkedIn or any place you want people to find you.
                  </p>
                </div>
              </div>
            </div>

            {/* Card: Your main offer */}
            <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
              <h2 className="mb-6 text-xl font-bold text-black">
                Your main offer
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    What do you sell in one or two sentences <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.what_you_sell}
                    onChange={(e) => updateField('what_you_sell', e.target.value)}
                    rows={4}
                    className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-black bg-white transition-all duration-200 focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none hover:border-gray-400"
                    placeholder="Describe what you sell..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Who is this for <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.who_is_this_for}
                    onChange={(e) => updateField('who_is_this_for', e.target.value)}
                    rows={4}
                    className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-black bg-white transition-all duration-200 focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none hover:border-gray-400"
                    placeholder="Describe your target audience..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Guidance */}
          <div className="space-y-6">
            <div className="rounded-xl bg-[#8359ee]/10 p-6 border border-[#8359ee]/20 transition-all duration-300 hover:shadow-sm">
              <h3 className="text-base font-bold text-black mb-3">Why this step matters</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                These answers help Klaro talk about you in simple language. Once this step is done, we can already start preparing for your brand call.
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-6 border border-gray-200 transition-all duration-300 hover:shadow-sm">
              <h3 className="text-base font-bold text-black mb-3">Required to continue</h3>
              <p className="text-sm text-gray-700 mb-3">
                To unlock Step 2, please fill:
              </p>
              <ul className="list-inside list-disc text-sm text-gray-700 space-y-2 mb-3">
                <li>Business name</li>
                <li>Your name and role</li>
                <li>Contact email</li>
                <li>Phone or WhatsApp</li>
                <li>At least one social link</li>
                <li>What you sell</li>
                <li>Who it is for</li>
              </ul>
              <p className="text-sm font-semibold text-[#8359ee]">
                Required fields complete: {completedCount} of {totalRequired}
              </p>
            </div>

            <div className="rounded-xl bg-green-50 p-6 border border-green-100 transition-all duration-300 hover:shadow-sm">
              <h3 className="text-base font-bold text-black mb-3">Next from us</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Once Step 1 is complete, we will review your answers and send a link to book your brand call.
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

