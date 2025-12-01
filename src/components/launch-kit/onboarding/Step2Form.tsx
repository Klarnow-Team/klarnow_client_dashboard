'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProjectWithRelations, OnboardingStep } from '@/types/project'
import { fetchQuizSubmission, mapQuizToStep2Fields } from '@/utils/fetchQuizSubmission'
import { mergeQuizDataWithFormData } from '@/utils/onboarding-save'
import Link from 'next/link'

interface Step2FormProps {
  project: ProjectWithRelations | null
  step: OnboardingStep | undefined
}

interface FormData {
  logo_url: string
  brand_colors: string[]
  brand_photos: string[]
  inspiration_sites: string[]
  ideal_client_description: string
  top_3_problems: string[]
  top_3_results: string[]
  testimonials: string[]
  review_links: string[]
  voice_words: string[]
  words_to_avoid: string
}

export default function LaunchKitStep2Form({ project, step }: Step2FormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Get step data - merge existing step.fields with base empty form structure
  const getStepData = () => {
    // Base empty form structure with all required fields
    const baseForm: FormData = {
      logo_url: '',
      brand_colors: [''],
      brand_photos: [],
      inspiration_sites: [''],
      ideal_client_description: '',
      top_3_problems: ['', '', ''],
      top_3_results: ['', '', ''],
      testimonials: [''],
      review_links: [''],
      voice_words: ['', '', ''],
      words_to_avoid: '',
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
          console.log('Quiz submission loaded for Step 2:', {
            id: quizSubmission.id,
            name: quizSubmission.full_name
          })
          // Map quiz data to Step 2 fields
          const mappedFields = mapQuizToStep2Fields(quizSubmission, 'LAUNCH')
          
          // Pre-fill all matching fields from quiz submission
          // Since we start with empty form, we can safely fill all fields
          setFormData(prev => {
            const updated = { ...prev }
            Object.keys(mappedFields).forEach(key => {
              const fieldKey = key as keyof FormData
              // Fill the field with quiz data (form starts empty, so this is safe)
              if (mappedFields[key] !== undefined && mappedFields[key] !== null) {
                if (fieldKey === 'voice_words' && Array.isArray(mappedFields[key])) {
                  updated.voice_words = mappedFields[key] as string[]
                } else if (fieldKey === 'top_3_results' && Array.isArray(mappedFields[key])) {
                  updated.top_3_results = mappedFields[key] as string[]
                } else if (fieldKey === 'ideal_client_description') {
                  updated.ideal_client_description = mappedFields[key] as string
                }
              }
            })
            console.log('Pre-filled Step 2 fields from quiz submission:', Object.keys(mappedFields))
            return updated
          })
        }
      } catch (error) {
        console.error('Error loading quiz data from Supabase:', error)
      }
    }

    loadQuizData()
  }, [])

  // Calculate completed required fields
  const requiredFields = [
    formData.logo_url,
    formData.brand_colors.some(c => c.trim()),
    formData.brand_photos.length > 0,
    formData.ideal_client_description,
    formData.top_3_problems.every(p => p.trim()),
    formData.top_3_results.every(r => r.trim()),
    formData.testimonials.some(t => t.trim()),
    formData.voice_words.every(v => v.trim()),
  ]
  
  const completedCount = requiredFields.filter(Boolean).length
  const totalRequired = 7
  // Allow completion if at least 6 out of 7 fields are filled (more lenient)
  const isComplete = completedCount >= 6

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addArrayItem = (field: 'inspiration_sites' | 'testimonials' | 'review_links', value: string = '') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], value]
    }))
  }

  const removeArrayItem = (field: 'inspiration_sites' | 'testimonials' | 'review_links', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const updateArrayItem = (field: 'inspiration_sites' | 'testimonials' | 'review_links' | 'top_3_problems' | 'top_3_results' | 'voice_words' | 'brand_colors', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
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
              const mappedFields = mapQuizToStep2Fields(quizSubmission, kitType)
              allFields = mergeQuizDataWithFormData(allFields, mappedFields, true) as FormData
              console.log('[Step2] Re-merged quiz data before saving')
            }
          }
        }
      } catch (error) {
        console.warn('[Step2] Could not re-merge quiz data before saving:', error)
      }
      
      console.log('[Step2] Saving all fields to localStorage:', {
        fieldCount: Object.keys(allFields).length,
        fields: Object.keys(allFields),
        hasPrefilledData: Object.values(allFields).some(v => v && v !== '' && (Array.isArray(v) ? v.length > 0 : true))
      })
      
      const stepDataLocal = {
        id: `step-2-${Date.now()}`,
        step_number: 2,
        title: 'Show us your brand',
        status: isComplete ? 'DONE' : 'IN_PROGRESS',
        required_fields_total: totalRequired,
        required_fields_completed: completedCount,
        time_estimate: 'About 8 minutes',
        fields: allFields, // Save ALL fields including prefilled ones
        started_at: step?.started_at || new Date().toISOString(),
        completed_at: isComplete ? new Date().toISOString() : null,
      }

      const stepIndex = onboardingData.steps.findIndex((s: any) => s.step_number === 2)
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
        router.push('/launch-kit/onboarding/step-3')
      } else {
        router.push('/launch-kit')
      }
    } catch (err: any) {
      setError(err.message)
      setIsSaving(false)
    }
  }

  // Check if step 1 is complete
  const onboardingData = localStorage.getItem('onboarding_LAUNCH')
  const step1Complete = onboardingData ? JSON.parse(onboardingData).steps?.find((s: any) => s.step_number === 1)?.status === 'DONE' : false

  if (!step) {
    return <div>Step not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">
              Launch Kit – Step 2 of 3
            </h1>
            <p className="mt-2 text-lg text-black">
              Logo, colours, photos and who you serve.
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
            <span>Step 2 – Show us your brand</span>
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

        {/* Completion Banner */}
        {step1Complete && isComplete && (
          <div className="mb-6 rounded-lg bg-green-50 border-2 border-green-200 p-4">
            <p className="text-sm font-medium text-black">
              ✅ You have given us enough to start building your site. We can begin once you complete Step 3 or on our next call.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card A: Brand visuals */}
            <div className="rounded-lg bg-white p-8 shadow-md border border-gray-100">
              <h2 className="mb-6 text-xl font-bold text-black">
                Brand visuals
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Logo upload <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        // For mock, just store filename
                        updateField('logo_url', file.name)
                      }
                    }}
                    className="mt-1 block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    Upload your logo file (PNG, JPG, or SVG)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Brand colours <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {formData.brand_colors.map((color, index) => (
                      <div key={index} className="flex gap-3">
                        <input
                          type="color"
                          value={color || '#000000'}
                          onChange={(e) => updateArrayItem('brand_colors', index, e.target.value)}
                          className="h-12 w-20 rounded-lg border-2 border-gray-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={color}
                          onChange={(e) => updateArrayItem('brand_colors', index, e.target.value)}
                          placeholder="#000000"
                          className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Add your brand colors (hex codes)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Brand photos <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      updateField('brand_photos', files.map(f => f.name))
                    }}
                    className="mt-1 block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    Upload multiple photos that represent your brand
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Inspiration sites
                  </label>
                  <div className="space-y-3">
                    {formData.inspiration_sites.map((site, index) => (
                      <div key={index} className="flex gap-3">
                        <input
                          type="url"
                          value={site}
                          onChange={(e) => updateArrayItem('inspiration_sites', index, e.target.value)}
                          placeholder="https://example.com"
                          className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                        />
                        {formData.inspiration_sites.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayItem('inspiration_sites', index)}
                            className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors border-2 border-red-200"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addArrayItem('inspiration_sites')}
                    className="mt-3 text-sm font-medium text-[#8359ee] hover:text-[#8359ee]/80 transition-colors"
                  >
                    + Add another site
                  </button>
                </div>
              </div>
            </div>

            {/* Card B: Clients and proof */}
            <div className="rounded-lg bg-white p-8 shadow-md border border-gray-100">
              <h2 className="mb-6 text-xl font-bold text-black">
                Clients and proof
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Ideal client description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.ideal_client_description}
                    onChange={(e) => updateField('ideal_client_description', e.target.value)}
                    rows={4}
                    className="mt-1 block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                    placeholder="Describe your ideal client..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Top 3 problems <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {formData.top_3_problems.map((problem, index) => (
                      <input
                        key={index}
                        type="text"
                        value={problem}
                        onChange={(e) => updateArrayItem('top_3_problems', index, e.target.value)}
                        placeholder={`Problem ${index + 1}`}
                        className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Top 3 results <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {formData.top_3_results.map((result, index) => (
                      <input
                        key={index}
                        type="text"
                        value={result}
                        onChange={(e) => updateArrayItem('top_3_results', index, e.target.value)}
                        placeholder={`Result ${index + 1}`}
                        className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Testimonials <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {formData.testimonials.map((testimonial, index) => (
                      <textarea
                        key={index}
                        value={testimonial}
                        onChange={(e) => updateArrayItem('testimonials', index, e.target.value)}
                        rows={3}
                        placeholder="Testimonial text..."
                        className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addArrayItem('testimonials')}
                    className="mt-3 text-sm font-medium text-[#8359ee] hover:text-[#8359ee]/80 transition-colors"
                  >
                    + Add another testimonial
                  </button>
                  <p className="mt-2 text-sm text-gray-600">
                    Add 3+ testimonials (minimum 1 required)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Review links
                  </label>
                  <div className="space-y-3">
                    {formData.review_links.map((link, index) => (
                      <div key={index} className="flex gap-3">
                        <input
                          type="url"
                          value={link}
                          onChange={(e) => updateArrayItem('review_links', index, e.target.value)}
                          placeholder="https://..."
                          className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                        />
                        {formData.review_links.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayItem('review_links', index)}
                            className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors border-2 border-red-200"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addArrayItem('review_links')}
                    className="mt-3 text-sm font-medium text-[#8359ee] hover:text-[#8359ee]/80 transition-colors"
                  >
                    + Add another review link
                  </button>
                </div>
              </div>
            </div>

            {/* Card C: Voice and vibe */}
            <div className="rounded-lg bg-white p-8 shadow-md border border-gray-100">
              <h2 className="mb-6 text-xl font-bold text-black">
                Voice and vibe
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    3 voice words <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {formData.voice_words.map((word, index) => (
                      <input
                        key={index}
                        type="text"
                        value={word}
                        onChange={(e) => updateArrayItem('voice_words', index, e.target.value)}
                        placeholder={`Voice word ${index + 1}`}
                        className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Three words that describe your brand voice
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Words or phrases to avoid
                  </label>
                  <textarea
                    value={formData.words_to_avoid}
                    onChange={(e) => updateField('words_to_avoid', e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                    placeholder="List words or phrases to avoid..."
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
                This is where your brand comes to life. Your visuals, voice, and proof help us create a site that truly represents you.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-6 border-2 border-gray-200">
              <h3 className="text-base font-bold text-black mb-3">Required to continue</h3>
              <p className="text-sm text-black mb-3">
                To unlock Step 3, please complete:
              </p>
              <ul className="list-inside list-disc text-sm text-black space-y-2 mb-3">
                <li>Logo upload</li>
                <li>Brand colours</li>
                <li>Brand photos</li>
                <li>Ideal client description</li>
                <li>Top 3 problems</li>
                <li>Top 3 results</li>
                <li>Testimonials (3-10)</li>
                <li>3 voice words</li>
              </ul>
              <p className="text-sm font-semibold text-black">
                Required fields complete: {completedCount} of {totalRequired}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-6 border-2 border-green-100">
              <h3 className="text-base font-bold text-black mb-3">Next from us</h3>
              <p className="text-sm text-black leading-relaxed">
                Once this step is done, we can lock your message and start writing your copy.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-10 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 pt-8">
          <Link
            href="/launch-kit/onboarding/step-1"
            className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-gray-50 transition-all duration-200 text-center hover:border-gray-400"
          >
            Back to Step 1
          </Link>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving || !isComplete}
            className="rounded-full bg-[#8359ee] px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#8359ee]/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#8359ee] hover:shadow-lg transform hover:-translate-y-0.5"
          >
            {isSaving ? 'Saving...' : 'Save and continue to Step 3'}
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

