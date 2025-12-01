'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProjectWithRelations, OnboardingStep } from '@/types/project'
import { fetchQuizSubmission, mapQuizToStep3Fields } from '@/utils/fetchQuizSubmission'
import { mergeQuizDataWithFormData } from '@/utils/onboarding-save'
import Link from 'next/link'

interface Step3FormProps {
  project: ProjectWithRelations | null
  step: OnboardingStep | undefined
}

interface FormData {
  domain_provider: string
  existing_site_platform: string
  how_share_access: string
  contact_form_email: string
  privacy_terms_link: string
}

export default function LaunchKitStep3Form({ project, step }: Step3FormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  
  const getStepData = () => {
    // Base empty form structure with all required fields
    const baseForm: FormData = {
      domain_provider: '',
      existing_site_platform: '',
      how_share_access: '',
      contact_form_email: '',
      privacy_terms_link: '',
    }
    
    // If step.fields exists, merge it with base form
    if (step?.fields && typeof step.fields === 'object') {
      return { ...baseForm, ...step.fields }
    }
    
    return baseForm
  }
  
  const [formData, setFormData] = useState<FormData>(getStepData())

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

        // Fetch by ID (preferred) or email (fallback)
        const quizSubmission = await fetchQuizSubmission(quizSubmissionId, userEmail)
        
        if (quizSubmission) {
          console.log('Quiz submission loaded for Step 3:', {
            id: quizSubmission.id,
            name: quizSubmission.full_name
          })
          // Map quiz data to Step 3 fields
          const mappedFields = mapQuizToStep3Fields(quizSubmission, 'LAUNCH')
          
          // Pre-fill all matching fields from quiz submission
          // Use merge utility to ensure prefilled data overwrites empty strings
          setFormData(prev => {
            const merged = mergeQuizDataWithFormData(prev, mappedFields, true) as FormData
            console.log('[Step3] Pre-filled form fields from quiz submission:', {
              mappedFields: Object.keys(mappedFields),
              mergedFields: Object.keys(merged)
            })
            return merged
          })
        }
      } catch (error) {
        console.error('Error loading quiz data from Supabase:', error)
      }
    }

    loadQuizData()
  }, [])

  const requiredFields = [
    formData.domain_provider,
    formData.how_share_access,
    formData.contact_form_email,
  ]
  
  const completedCount = requiredFields.filter(Boolean).length
  const totalRequired = 3
  // Allow saving if at least 2 out of 3 fields are filled (more lenient)
  const formIsComplete = completedCount >= 2
  // But require ALL fields to be filled to show success/complete onboarding
  const allFieldsComplete = completedCount === totalRequired

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
      const kitType = user.kitType || user.kit_type || 'LAUNCH'

      // Save to localStorage only
      const storageKey = `onboarding_${kitType}`
      const existingData = localStorage.getItem(storageKey)
      const onboardingData = existingData ? JSON.parse(existingData) : {
        steps: [],
        onboarding_percent: 0
      }

      // Before saving, ensure prefilled quiz data is merged (in case it wasn't loaded yet)
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
              const mappedFields = mapQuizToStep3Fields(quizSubmission, kitType)
              allFields = mergeQuizDataWithFormData(allFields, mappedFields, true) as FormData
              console.log('[Step3] Re-merged quiz data before saving')
            }
          }
        }
      } catch (error) {
        console.warn('[Step3] Could not re-merge quiz data before saving:', error)
      }
      
      console.log('[Step3] Saving all fields to localStorage:', {
        fieldCount: Object.keys(allFields).length,
        fields: Object.keys(allFields),
        hasPrefilledData: Object.values(allFields).some(v => v && v !== '' && (Array.isArray(v) ? v.length > 0 : true))
      })
      
      const stepDataLocal = {
        id: `step-3-${Date.now()}`,
        step_number: 3,
        title: 'Switch on the site',
        status: allFieldsComplete ? 'DONE' : 'IN_PROGRESS',
        required_fields_total: totalRequired,
        required_fields_completed: completedCount,
        time_estimate: 'About 5 minutes',
        fields: allFields, // Save ALL fields including prefilled ones
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

            // Before sending, re-merge quiz data for all steps to ensure nothing is missing
            let quizSubmission = null
            const quizSubmissionId = user.quiz_submission_id
            const userEmail = user.email || user.email_address
            
            if (quizSubmissionId || userEmail) {
              try {
                quizSubmission = await fetchQuizSubmission(quizSubmissionId, userEmail)
              } catch (error) {
                console.warn('[Step3] Could not fetch quiz submission for final merge:', error)
              }
            }
            
            // Ensure all steps have complete field data before sending
            const stepsToSend = await Promise.all(allSteps.map(async (s: any) => {
              let completeFields = { ...(s.fields || {}) }
              
              // Re-merge quiz data for each step if available
              if (quizSubmission) {
                let mappedFields: Record<string, any> = {}
                if (s.step_number === 1) {
                  const { mapQuizToOnboardingFields } = await import('@/utils/fetchQuizSubmission')
                  mappedFields = mapQuizToOnboardingFields(quizSubmission, kitType)
                } else if (s.step_number === 2) {
                  const { mapQuizToStep2Fields } = await import('@/utils/fetchQuizSubmission')
                  mappedFields = mapQuizToStep2Fields(quizSubmission, kitType)
                } else if (s.step_number === 3) {
                  const { mapQuizToStep3Fields } = await import('@/utils/fetchQuizSubmission')
                  mappedFields = mapQuizToStep3Fields(quizSubmission, kitType)
                }
                
                // Merge quiz data to ensure all prefilled fields are included
                completeFields = mergeQuizDataWithFormData(completeFields, mappedFields, true) as Record<string, any>
              }
              
              console.log(`[Step3] Sending step ${s.step_number} with ${Object.keys(completeFields).length} fields:`, Object.keys(completeFields))
              
              return {
                step_number: s.step_number,
                title: s.title,
                status: s.status,
                required_fields_total: s.required_fields_total,
                required_fields_completed: s.required_fields_completed,
                time_estimate: s.time_estimate,
                fields: completeFields, // ALL fields including prefilled ones
                started_at: s.started_at,
                completed_at: s.completed_at || (s.status === 'DONE' ? new Date().toISOString() : null)
              }
            }))
            
            console.log('[Step3] Sending all 3 steps to database with complete field data (re-merged with quiz data)')
            
            const response = await fetch('/api/onboarding/complete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email,
                kit_type: kitType,
                steps: stepsToSend
              }),
            })

            if (!response.ok) {
              let errorData: any = {}
              try {
                const text = await response.text()
                errorData = text ? JSON.parse(text) : { error: `HTTP ${response.status}: ${response.statusText}` }
              } catch (parseError) {
                errorData = { 
                  error: `HTTP ${response.status}: ${response.statusText}`,
                  rawResponse: await response.text().catch(() => 'Unable to read response')
                }
              }
              console.error('Failed to save onboarding to database:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
              })
              // Don't block success - data is saved in localStorage
              // Just log the error
            } else {
              const result = await response.json()
              console.log('Onboarding saved to database successfully!', result)
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
        // Redirect to home dashboard after onboarding completion
        setTimeout(() => {
          router.push('/home')
        }, 2000)
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
            <h1 className="text-3xl font-bold text-black mb-4">Onboarding complete</h1>
            <p className="text-lg text-black mb-6">
              You have finished all three steps.
            </p>
            <p className="text-base text-black mb-8">
              Klaro now has everything it needs to start your Launch Kit project.
              You will see live updates in your dashboard as we move through copy, design and launch.
            </p>
            <Link
              href="/launch-kit"
              className="inline-block rounded-lg bg-[#8359ee] px-8 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#8359ee]/90 transition-all"
            >
              Go to Launch Kit Dashboard
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
              Launch Kit – Step 3 of 3
            </h1>
            <p className="mt-2 text-lg text-black">
              Domain, forms and anything we need to launch.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="rounded-full bg-[#8359ee]/10 px-4 py-2 text-sm font-medium text-[#8359ee]">
              {step.time_estimate}
            </div>
            <div className="text-sm font-semibold text-black">
              Required fields {completedCount} / 3 complete
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm font-medium text-black mb-2">
            <span>Step 3 – Switch on the site</span>
            <span className="font-semibold">{Math.round((completedCount / 3) * 100)}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#8359ee] transition-all duration-300"
              style={{ width: `${(completedCount / 3) * 100}%` }}
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
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-8 shadow-md border border-gray-100">
              <h2 className="mb-6 text-xl font-bold text-black">
                Tech and launch
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Domain provider <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.domain_provider}
                    onChange={(e) => updateField('domain_provider', e.target.value)}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  >
                    <option value="">Select domain provider...</option>
                    <option value="GoDaddy">GoDaddy</option>
                    <option value="Namecheap">Namecheap</option>
                    <option value="Google Domains">Google Domains</option>
                    <option value="Cloudflare">Cloudflare</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Existing site platform
                  </label>
                  <input
                    type="text"
                    value={formData.existing_site_platform}
                    onChange={(e) => updateField('existing_site_platform', e.target.value)}
                    placeholder="e.g., WordPress, Squarespace, etc."
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    How you will share access <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.how_share_access}
                    onChange={(e) => updateField('how_share_access', e.target.value)}
                    rows={4}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                    placeholder="Describe how you'll share access credentials..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Email for contact form <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.contact_form_email}
                    onChange={(e) => updateField('contact_form_email', e.target.value)}
                    placeholder="contact@yourdomain.com"
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Privacy/terms link
                  </label>
                  <input
                    type="url"
                    value={formData.privacy_terms_link}
                    onChange={(e) => updateField('privacy_terms_link', e.target.value)}
                    placeholder="https://..."
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Guidance */}
          <div className="space-y-6">
            <div className="rounded-lg bg-[#8359ee]/10 p-6 border-2 border-[#8359ee]/20">
              <h3 className="text-base font-bold text-black mb-3">Why this step matters</h3>
              <p className="text-sm text-black leading-relaxed">
                This is what lets us connect your domain and test forms before launch.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-6 border-2 border-gray-200">
              <h3 className="text-base font-bold text-black mb-3">Required to finish</h3>
              <p className="text-sm text-black mb-3">
                Fill domain details, access details and contact email to complete Launch Kit onboarding.
              </p>
              <ul className="list-inside list-disc text-sm text-black space-y-2 mb-3">
                <li>Domain provider</li>
                <li>How you will share access</li>
                <li>Email for contact form</li>
              </ul>
              <p className="text-sm font-semibold text-black">
                Required fields complete: {completedCount} of 3
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-6 border-2 border-green-100">
              <h3 className="text-base font-bold text-black mb-3">Next from us</h3>
              <p className="text-sm text-black leading-relaxed">
                Once this step is done, we prepare your site for launch.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-10 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 pt-8">
          <Link
            href="/launch-kit/onboarding/step-2"
            className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-gray-50 transition-all duration-200 text-center hover:border-gray-400"
          >
            Back to Step 2
          </Link>
          <button
            type="button"
            onClick={handleFinish}
            disabled={isSaving || !allFieldsComplete}
            className="rounded-full bg-[#8359ee] px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#8359ee]/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#8359ee] hover:shadow-lg transform hover:-translate-y-0.5"
          >
            {isSaving ? 'Saving...' : 'Finish onboarding'}
          </button>
        </div>

        {!allFieldsComplete && (
          <div className="mt-6 rounded-full bg-yellow-50 border border-yellow-200 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-sm font-medium text-black">
              Please complete all required fields marked with * to finish onboarding.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

