'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProjectWithRelations, OnboardingStep } from '@/types/project'
import Link from 'next/link'

interface Step2FormProps {
  project: ProjectWithRelations | null
  step: OnboardingStep | undefined
}

interface FormData {
  ideal_client_description: string
  top_5_pains: string[]
  top_5_outcomes: string[]
  common_objections: string
  reasons_choose_you: string
  competitors_alternatives: string
  voice_words: string[]
  words_to_avoid: string
  testimonials: string[]
  case_studies: Array<{
    client_type: string
    problem: string
    what_you_did: string
    result: string
  }>
  review_links: string[]
  logos_awards_features: string
  top_10_buyer_questions: string[]
  common_mistakes_myths: string[]
  topics_to_be_known_for: string
  existing_lead_magnet: string
  keep_replace_lead_magnet: string
}

export default function GrowthKitStep2Form({ project, step }: Step2FormProps) {
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
        const step2 = onboarding.steps?.find((s: any) => s.step_number === 2)
        if (step2?.fields) return step2.fields
      }
    }
    
    return {
      ideal_client_description: '',
      top_5_pains: ['', '', '', '', ''],
      top_5_outcomes: ['', '', '', '', ''],
      common_objections: '',
      reasons_choose_you: '',
      competitors_alternatives: '',
      voice_words: ['', '', ''],
      words_to_avoid: '',
      testimonials: [''],
      case_studies: [
        { client_type: '', problem: '', what_you_did: '', result: '' },
        { client_type: '', problem: '', what_you_did: '', result: '' },
        { client_type: '', problem: '', what_you_did: '', result: '' }
      ],
      review_links: [''],
      logos_awards_features: '',
      top_10_buyer_questions: [''],
      common_mistakes_myths: ['', '', ''],
      topics_to_be_known_for: '',
      existing_lead_magnet: '',
      keep_replace_lead_magnet: '',
    }
  }
  
  const [formData, setFormData] = useState<FormData>(getStepData())

  const requiredFields = [
    formData.ideal_client_description,
    formData.top_5_pains.every(p => p.trim()),
    formData.top_5_outcomes.every(o => o.trim()),
    formData.common_objections,
    formData.voice_words.every(v => v.trim()),
    formData.testimonials.some(t => t.trim()), // Only require at least 1 testimonial
    formData.case_studies.length >= 3 && formData.case_studies.every(cs => 
      cs.client_type.trim() && cs.problem.trim() && cs.what_you_did.trim() && cs.result.trim()
    ),
    formData.top_10_buyer_questions.some(q => q.trim()) && formData.top_10_buyer_questions.filter(q => q.trim()).length >= 10,
    formData.common_mistakes_myths.every(m => m.trim()),
  ]
  
  const completedCount = requiredFields.filter(Boolean).length
  const totalRequired = 9
  // Allow completion if at least 7 out of 9 fields are filled (more lenient)
  const isComplete = completedCount >= 7

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateArrayItem = (field: 'top_5_pains' | 'top_5_outcomes' | 'voice_words' | 'testimonials' | 'review_links' | 'top_10_buyer_questions' | 'common_mistakes_myths', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayItem = (field: 'testimonials' | 'review_links' | 'top_10_buyer_questions' | 'case_studies') => {
    if (field === 'case_studies') {
      setFormData(prev => ({
        ...prev,
        case_studies: [...prev.case_studies, { client_type: '', problem: '', what_you_did: '', result: '' }]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], '']
      }))
    }
  }

  const removeArrayItem = (field: 'testimonials' | 'review_links' | 'top_10_buyer_questions' | 'case_studies', index: number) => {
    if (field === 'case_studies') {
      setFormData(prev => ({
        ...prev,
        case_studies: prev.case_studies.filter((_, i) => i !== index)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }))
    }
  }

  const updateCaseStudy = (index: number, field: 'client_type' | 'problem' | 'what_you_did' | 'result', value: string) => {
    setFormData(prev => ({
      ...prev,
      case_studies: prev.case_studies.map((cs, i) =>
        i === index ? { ...cs, [field]: value } : cs
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
      const kitType = user.kitType || user.kit_type || 'GROWTH'

      // Save to localStorage only
      const storageKey = `onboarding_${kitType}`
      const existingData = localStorage.getItem(storageKey)
      const onboardingData = existingData ? JSON.parse(existingData) : {
        steps: [],
        onboarding_percent: 0
      }

      const stepDataLocal = {
        id: `step-2-${Date.now()}`,
        step_number: 2,
        title: 'Clients, proof and content fuel',
        status: isComplete ? 'DONE' : 'IN_PROGRESS',
        required_fields_total: totalRequired,
        required_fields_completed: completedCount,
        time_estimate: 'About 10 minutes',
        fields: formData,
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
        router.push('/growth-kit/onboarding/step-3')
      } else {
        router.push('/growth-kit')
      }
    } catch (err: any) {
      setError(err.message)
      setIsSaving(false)
    }
  }

  // Check if step 1 is complete for completion banner
  const onboardingData = localStorage.getItem('onboarding_GROWTH')
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
              Growth Kit – Step 2 of 3
            </h1>
            <p className="mt-2 text-lg text-black">
              Clients, proof and content that feeds your funnel.
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
            <span>Step 2 – Clients, proof and content fuel</span>
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
              ✅ You have given us enough to start building your funnel. We can begin once you complete Step 3 or on our next call.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card A: Your people */}
            <div className="rounded-lg bg-white p-8 shadow-md border border-gray-100">
              <h2 className="mb-6 text-xl font-bold text-black">
                Your people
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
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                    placeholder="Describe your ideal client..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Top 5 pains <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {formData.top_5_pains.map((pain, index) => (
                      <input
                        key={index}
                        type="text"
                        value={pain}
                        onChange={(e) => updateArrayItem('top_5_pains', index, e.target.value)}
                        placeholder={`Pain ${index + 1}`}
                        className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Top 5 outcomes they want <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {formData.top_5_outcomes.map((outcome, index) => (
                      <input
                        key={index}
                        type="text"
                        value={outcome}
                        onChange={(e) => updateArrayItem('top_5_outcomes', index, e.target.value)}
                        placeholder={`Outcome ${index + 1}`}
                        className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Common objections (3 to 5) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.common_objections}
                    onChange={(e) => updateField('common_objections', e.target.value)}
                    rows={4}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                    placeholder="List common objections..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Reasons people choose you
                  </label>
                  <textarea
                    value={formData.reasons_choose_you}
                    onChange={(e) => updateField('reasons_choose_you', e.target.value)}
                    rows={3}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                    placeholder="Why do people choose you over alternatives?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Competitors or alternatives
                  </label>
                  <textarea
                    value={formData.competitors_alternatives}
                    onChange={(e) => updateField('competitors_alternatives', e.target.value)}
                    rows={3}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                    placeholder="Who are your main competitors or alternatives?"
                  />
                </div>
              </div>
            </div>

            {/* Card B: Voice and proof */}
            <div className="rounded-lg bg-white p-8 shadow-md border border-gray-100">
              <h2 className="mb-6 text-xl font-bold text-black">
                Voice and proof
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    3 words for your voice <span className="text-red-500">*</span>
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
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Words or phrases to avoid
                  </label>
                  <textarea
                    value={formData.words_to_avoid}
                    onChange={(e) => updateField('words_to_avoid', e.target.value)}
                    rows={3}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                    placeholder="List words or phrases to avoid..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Testimonials (5 to 15) <span className="text-red-500">*</span>
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
                    Add 5+ testimonials (minimum 1 required)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Case study outlines (3 to 5) <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-4">
                    {formData.case_studies.map((caseStudy, index) => (
                      <div key={index} className="rounded-lg border-2 border-gray-200 p-4 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Client type
                          </label>
                          <input
                            type="text"
                            value={caseStudy.client_type}
                            onChange={(e) => updateCaseStudy(index, 'client_type', e.target.value)}
                            placeholder="Type of client"
                            className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Problem
                          </label>
                          <textarea
                            value={caseStudy.problem}
                            onChange={(e) => updateCaseStudy(index, 'problem', e.target.value)}
                            rows={2}
                            placeholder="What problem did they have?"
                            className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            What you did
                          </label>
                          <textarea
                            value={caseStudy.what_you_did}
                            onChange={(e) => updateCaseStudy(index, 'what_you_did', e.target.value)}
                            rows={2}
                            placeholder="What did you do to help?"
                            className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Result
                          </label>
                          <textarea
                            value={caseStudy.result}
                            onChange={(e) => updateCaseStudy(index, 'result', e.target.value)}
                            rows={2}
                            placeholder="What was the result?"
                            className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                          />
                        </div>
                        {formData.case_studies.length > 3 && (
                          <button
                            type="button"
                            onClick={() => removeArrayItem('case_studies', index)}
                            className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                          >
                            Remove case study
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {formData.case_studies.length < 5 && (
                    <button
                      type="button"
                      onClick={() => addArrayItem('case_studies')}
                      className="mt-3 text-sm font-medium text-[#8359ee] hover:text-[#8359ee]/80 transition-colors"
                    >
                      + Add another case study
                    </button>
                  )}
                  <p className="mt-2 text-sm text-gray-600">
                    Minimum 3 case studies required
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

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Logos, awards, features
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        updateField('logos_awards_features', file.name)
                      }
                    }}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  />
                  <textarea
                    value={formData.logos_awards_features}
                    onChange={(e) => updateField('logos_awards_features', e.target.value)}
                    rows={2}
                    placeholder="Optional description..."
                    className="mt-2 block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Card C: Content fuel */}
            <div className="rounded-lg bg-white p-8 shadow-md border border-gray-100">
              <h2 className="mb-6 text-xl font-bold text-black">
                Content fuel
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Top 10 buyer questions <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {formData.top_10_buyer_questions.map((question, index) => (
                      <input
                        key={index}
                        type="text"
                        value={question}
                        onChange={(e) => updateArrayItem('top_10_buyer_questions', index, e.target.value)}
                        placeholder={`Question ${index + 1}`}
                        className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                      />
                    ))}
                  </div>
                  {formData.top_10_buyer_questions.length < 10 && (
                    <button
                      type="button"
                      onClick={() => addArrayItem('top_10_buyer_questions')}
                      className="mt-3 text-sm font-medium text-[#8359ee] hover:text-[#8359ee]/80 transition-colors"
                    >
                      + Add another question
                    </button>
                  )}
                  <p className="mt-2 text-sm text-gray-600">
                    Minimum 10 questions required
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    3 common mistakes or myths <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {formData.common_mistakes_myths.map((mistake, index) => (
                      <input
                        key={index}
                        type="text"
                        value={mistake}
                        onChange={(e) => updateArrayItem('common_mistakes_myths', index, e.target.value)}
                        placeholder={`Mistake or myth ${index + 1}`}
                        className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Topics you want to be known for (3 to 5)
                  </label>
                  <textarea
                    value={formData.topics_to_be_known_for}
                    onChange={(e) => updateField('topics_to_be_known_for', e.target.value)}
                    rows={3}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm resize-none"
                    placeholder="List topics you want to be known for..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Existing lead magnet (if any)
                  </label>
                  <input
                    type="file"
                    accept="*/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        updateField('existing_lead_magnet', file.name)
                      }
                    }}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  />
                  <input
                    type="url"
                    value={formData.existing_lead_magnet}
                    onChange={(e) => updateField('existing_lead_magnet', e.target.value)}
                    placeholder="Or enter URL..."
                    className="mt-2 block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Should we keep or replace your current lead magnet
                  </label>
                  <select
                    value={formData.keep_replace_lead_magnet}
                    onChange={(e) => updateField('keep_replace_lead_magnet', e.target.value)}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-black shadow-sm transition-colors focus:border-[#8359ee] focus:ring-2 focus:ring-[#8359ee]/20 focus:outline-none sm:text-sm"
                  >
                    <option value="">Select option...</option>
                    <option value="Keep and improve it">Keep and improve it</option>
                    <option value="Replace it">Replace it</option>
                    <option value="Not sure">Not sure</option>
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
                This is where your funnel gets its edge. Your answers here shape the copy, the lead magnet and the emails. The better we understand your clients and proof, the stronger your funnel will convert.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-6 border-2 border-gray-200">
              <h3 className="text-base font-bold text-black mb-3">Required to continue</h3>
              <p className="text-sm text-black mb-3">
                To unlock Step 3, please complete:
              </p>
              <ul className="list-inside list-disc text-sm text-black space-y-2 mb-3">
                <li>Ideal client description</li>
                <li>Top 5 pains</li>
                <li>Top 5 outcomes</li>
                <li>Common objections</li>
                <li>3 voice words</li>
                <li>5 to 15 testimonials</li>
                <li>3 case study outlines</li>
                <li>Top 10 buyer questions</li>
                <li>3 common mistakes or myths</li>
              </ul>
              <p className="text-sm font-semibold text-black">
                Required fields complete: {completedCount} of {totalRequired}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-6 border-2 border-green-100">
              <h3 className="text-base font-bold text-black mb-3">Next from us</h3>
              <p className="text-sm text-black leading-relaxed">
                Once Step 2 is complete, we will lock in your message and start drafting your site copy and email sequence.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-10 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 pt-8">
          <Link
            href="/growth-kit/onboarding/step-1"
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

