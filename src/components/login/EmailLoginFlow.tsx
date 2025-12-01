'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserLookupResponse } from '@/types/user'

type Step = 'email' | 'loading' | 'user-found' | 'error'
type KitType = 'LAUNCH' | 'GROWTH' | ''

export default function EmailLoginFlow() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [userData, setUserData] = useState<UserLookupResponse | null>(null)
  const [selectedKitType, setSelectedKitType] = useState<KitType>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setStep('loading')

    try {
      const response = await fetch('/api/users/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data: UserLookupResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to lookup user')
      }

      if (!data.exists) {
        setStep('error')
        setError(data.error || 'This email is not registered. Please complete the quiz to get access.')
        setIsLoading(false)
        return
      }

      // User exists
      setUserData(data)
      
      // PRIORITY: Always use preferred_kit from quiz_submission first (this is the user's actual plan)
      // Then fall back to available_kit_types, then kit_type
      if (data.quiz_submission?.preferred_kit) {
        const preferredKit = data.quiz_submission.preferred_kit.toUpperCase().trim() as 'LAUNCH' | 'GROWTH'
        setSelectedKitType(preferredKit)
      } else if (data.available_kit_types && data.available_kit_types.length > 0) {
        // If no preferred_kit, use the first available kit type
        setSelectedKitType(data.available_kit_types[0])
      } else if (data.kit_type) {
        // Otherwise use kit_type from existing user data
        setSelectedKitType(data.kit_type.toUpperCase().trim() as 'LAUNCH' | 'GROWTH')
      }
      
      setStep('user-found')
      setIsLoading(false)
    } catch (err: any) {
      setStep('error')
      setError(err.message || 'An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const handleContinue = async () => {
    setIsLoading(true)
    setError(null)
    
    if (!userData) {
      setError('User data not found. Please try again.')
      setIsLoading(false)
      return
    }
    
    // Determine kit type: prefer selectedKitType, then preferred_kit, then userData.kit_type
    // Also check the Select value in case selectedKitType state is not updated
    let kitType: KitType = selectedKitType
    
    // If selectedKitType is empty, try to get it from preferred_kit
    if (!kitType) {
      if (userData.quiz_submission?.preferred_kit) {
        kitType = userData.quiz_submission.preferred_kit.toUpperCase().trim() as 'LAUNCH' | 'GROWTH'
      } else if (userData.kit_type) {
        kitType = userData.kit_type.toUpperCase().trim() as 'LAUNCH' | 'GROWTH'
      }
    }
    
    if (!kitType) {
      setError('Please select a plan to continue.')
      setIsLoading(false)
      return
    }

    // Store minimal user session in localStorage (quiz data will be fetched from Supabase)
    // PRIORITY: Use preferred_kit from quiz_submission first (this is the user's actual plan)
    // Then fall back to selected kit type, then userData kit_type
    let preferredKit: 'LAUNCH' | 'GROWTH' | undefined = undefined
    if (userData.quiz_submission?.preferred_kit) {
      const rawValue = userData.quiz_submission.preferred_kit
      const normalized = String(rawValue).toUpperCase().trim()
      
      // Handle various formats: "GROWTH", "Growth Kit", "growth", "GROWTH KIT", etc.
      if (normalized.includes('GROWTH')) {
        preferredKit = 'GROWTH'
      } else if (normalized.includes('LAUNCH')) {
        preferredKit = 'LAUNCH'
      } else if (normalized === 'GROWTH' || normalized === 'LAUNCH') {
        preferredKit = normalized as 'LAUNCH' | 'GROWTH'
      }
      
      console.log('Preferred kit from quiz:', {
        raw: rawValue,
        normalized,
        determined: preferredKit
      })
    }
    
    // Normalize kitType to uppercase and validate
    let normalizedKitType: 'LAUNCH' | 'GROWTH' | undefined = undefined
    if (kitType) {
      const normalized = kitType.toUpperCase().trim()
      if (normalized === 'LAUNCH' || normalized === 'GROWTH') {
        normalizedKitType = normalized as 'LAUNCH' | 'GROWTH'
      }
    }
    
    let normalizedUserKitType: 'LAUNCH' | 'GROWTH' | undefined = undefined
    if (userData.kit_type) {
      const normalized = userData.kit_type.toUpperCase().trim()
      if (normalized === 'LAUNCH' || normalized === 'GROWTH') {
        normalizedUserKitType = normalized as 'LAUNCH' | 'GROWTH'
      }
    }
    
    // Final kit type: preferred_kit from quiz submission takes highest priority
    // This MUST be used if available, as it's the user's actual plan from the quiz
    let finalKitType: 'LAUNCH' | 'GROWTH'
    
    if (preferredKit) {
      // Use preferred_kit from quiz submission (highest priority)
      finalKitType = preferredKit
      console.log('Using preferred_kit from quiz submission:', preferredKit)
    } else if (normalizedKitType) {
      // Use selected kit type from form
      finalKitType = normalizedKitType
      console.log('Using selected kit type from form:', normalizedKitType)
    } else if (normalizedUserKitType) {
      // Use kit_type from user data
      finalKitType = normalizedUserKitType
      console.log('Using kit_type from user data:', normalizedUserKitType)
    } else {
      // Fallback to LAUNCH (should not happen if preferred_kit exists)
      finalKitType = 'LAUNCH'
      console.warn('No kit type found, defaulting to LAUNCH')
    }
    
    // Ensure finalKitType is valid (should always be at this point, but double-check)
    if (finalKitType !== 'LAUNCH' && finalKitType !== 'GROWTH') {
      console.error('Unexpected kit type value:', finalKitType, {
        preferredKit,
        normalizedKitType,
        normalizedUserKitType,
        kitType,
        userData: userData.kit_type,
        quiz_submission: userData.quiz_submission?.preferred_kit
      })
      // Fallback to LAUNCH if something unexpected happens
      finalKitType = 'LAUNCH'
      console.warn('Falling back to LAUNCH kit type')
    }
    
    // Fetch and store server session ID to detect server restarts
    try {
      const sessionResponse = await fetch('/api/session/check')
      const { sessionId } = await sessionResponse.json()
      if (sessionId) {
        localStorage.setItem('serverSessionId', sessionId)
      }
    } catch (error) {
      console.error('Error fetching server session:', error)
    }

    // Normalize email before storing (ensure consistency)
    const normalizedEmail = email.toLowerCase().trim()
    
    // Clear any old onboarding data from previous users to prevent data leakage
    // This ensures each user starts fresh and doesn't see another user's data
    localStorage.removeItem('onboarding_LAUNCH')
    localStorage.removeItem('onboarding_GROWTH')
    console.log('Cleared old onboarding data from localStorage to prevent data leakage')
    
    // Check if user has already completed onboarding for this kit type
    const hasCompletedOnboarding = userData.onboarding_finished === true
    
    // Only store minimal session data - quiz submission will be fetched from Supabase when needed
    const sessionData = {
      email: normalizedEmail, // Store normalized email
      email_address: normalizedEmail, // Also store as email_address for backward compatibility
      name: userData.name || userData.quiz_submission?.full_name || null,
      kit_type: finalKitType,
      kitType: finalKitType, // Also store as kitType for backward compatibility
      onboarding_finished: hasCompletedOnboarding, // Use actual onboarding status from database
      quiz_submission_id: userData.quiz_submission?.id || null, // Store quiz submission ID for accurate fetching
      // Do not store full quiz_submission in localStorage - always fetch from Supabase by ID
    }
    localStorage.setItem('user', JSON.stringify(sessionData))
    console.log('User session stored with email:', normalizedEmail, 'ID:', sessionData.quiz_submission_id, 'onboarding_finished:', hasCompletedOnboarding)
    localStorage.setItem('isAuthenticated', 'true')

    // Redirect based on onboarding status
    let redirectPath: string
    if (hasCompletedOnboarding) {
      // User has completed onboarding - redirect to dashboard/home
      redirectPath = '/home'
      console.log('✅ ONBOARDING ALREADY COMPLETE - Redirecting to dashboard')
    } else {
      // User needs to complete onboarding - redirect to onboarding Step 1
      if (finalKitType === 'GROWTH') {
        redirectPath = '/growth-kit/onboarding/step-1'
        console.log('✅ GROWTH KIT DETECTED - Redirecting to Growth Kit onboarding')
      } else if (finalKitType === 'LAUNCH') {
        redirectPath = '/launch-kit/onboarding/step-1'
        console.log('✅ LAUNCH KIT DETECTED - Redirecting to Launch Kit onboarding')
      } else {
        // This should never happen, but handle it
        console.error('❌ Invalid finalKitType:', finalKitType, '- Defaulting to Launch Kit')
        redirectPath = '/launch-kit/onboarding/step-1'
        finalKitType = 'LAUNCH' // Ensure it's set correctly
      }
    }
    
    console.log('=== REDIRECT DECISION ===')
    console.log(`Email: ${email}`)
    console.log(`Final Kit Type: ${finalKitType}`)
    console.log(`Onboarding Finished: ${hasCompletedOnboarding}`)
    console.log(`Redirect Path: ${redirectPath}`)
    console.log('Kit type determination:', {
      preferredKit,
      normalizedKitType,
      normalizedUserKitType,
      selectedKitType,
      quizPreferredKit: userData.quiz_submission?.preferred_kit,
      quizPreferredKitRaw: userData.quiz_submission?.preferred_kit,
      userDataKitType: userData.kit_type
    })
    console.log('========================')
    
    try {
      router.push(redirectPath)
    } catch (error) {
      console.error('Error redirecting:', error)
      setError('Failed to redirect. Please try again.')
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setStep('email')
    setError(null)
    setUserData(null)
  }

  return (
    <div className="bg-white flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn('flex flex-col gap-6')}>
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit}>
              <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-3xl font-bold tracking-tight text-black">
                    Sign in to your account
                  </h1>
                  <FieldDescription className="text-black">
                    Klarnow Client Dashboard
                  </FieldDescription>
                </div>

                {error && (
                  <FieldError>
                    <div className="rounded-md p-4 bg-red-50">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </FieldError>
                )}

                <Field>
                  <FieldLabel htmlFor="email" className="text-black">
                    Email address
                  </FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full text-black"
                    disabled={isLoading}
                  />
                </Field>

                <Field>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Loading...' : 'Continue'}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          )}

          {step === 'loading' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="text-black">Looking up your account...</div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8359ee]"></div>
            </div>
          )}

          {step === 'user-found' && userData && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-black">
                  Welcome{userData.quiz_submission?.full_name || userData.name ? `, ${userData.quiz_submission?.full_name || userData.name}` : ''}
                </h1>
                <FieldDescription className="text-black">
                  Please confirm your plan to continue
                </FieldDescription>
              </div>

              {(userData.name || userData.quiz_submission?.full_name) && (
                <Field>
                  <FieldLabel className="text-black">Name</FieldLabel>
                  <Input
                    value={userData.quiz_submission?.full_name || userData.name || ''}
                    disabled
                    className="w-full text-black bg-gray-50"
                  />
                </Field>
              )}

              {userData.quiz_submission?.brand_name && (
                <Field>
                  <FieldLabel className="text-black">Brand Name</FieldLabel>
                  <Input
                    value={userData.quiz_submission.brand_name}
                    disabled
                    className="w-full text-black bg-gray-50"
                  />
                </Field>
              )}

              <Field>
                <FieldLabel htmlFor="kitType" className="text-black">
                  Your Plan {userData.quiz_submission?.preferred_kit ? '' : <span className="text-red-500">*</span>}
                </FieldLabel>
                <Select
                  value={selectedKitType || ''}
                  onValueChange={(value) => {
                    setSelectedKitType(value as KitType)
                    setError(null) // Clear any previous errors
                  }}
                  disabled={!!userData.quiz_submission?.preferred_kit} // Disable if preferred_kit is set
                >
                  <SelectTrigger 
                    id="kitType" 
                    className="w-full text-black"
                  >
                    <SelectValue placeholder="Select a plan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {userData.available_kit_types && userData.available_kit_types.length > 0 ? (
                      userData.available_kit_types.map((kit) => (
                        <SelectItem key={kit} value={kit}>
                          {kit === 'LAUNCH' 
                            ? 'Launch Kit - 3 page high trust site in 14 days'
                            : 'Growth Kit - 4 to 6 page funnel and emails in 14 days'}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="LAUNCH">
                          Launch Kit - 3 page high trust site in 14 days
                        </SelectItem>
                        <SelectItem value="GROWTH">
                          Growth Kit - 4 to 6 page funnel and emails in 14 days
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <FieldDescription className="text-black">
                  {userData.quiz_submission?.preferred_kit
                    ? `Your plan from quiz: ${userData.quiz_submission.preferred_kit === 'LAUNCH' || userData.quiz_submission.preferred_kit === 'launch' ? 'Launch Kit' : 'Growth Kit'}`
                    : userData.available_kit_types && userData.available_kit_types.length > 0
                    ? `Plans associated with this email (${userData.available_kit_types.length} available)`
                    : 'Please select a plan to continue'}
                </FieldDescription>
              </Field>

              {error && (
                <FieldError>
                  <div className="rounded-md p-4 bg-red-50">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </FieldError>
              )}

              <Field>
                <Button
                  onClick={handleContinue}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Continue'}
                </Button>
              </Field>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-sm text-[#8359ee] hover:text-[#8359ee]/80"
                >
                  Back to email
                </button>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-black">
                  Account Not Found
                </h1>
                <FieldDescription className="text-black">
                  This email is not registered in our system
                </FieldDescription>
              </div>

              {error && (
                <FieldError>
                  <div className="rounded-md p-4 bg-red-50">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </FieldError>
              )}

              <Field>
                <Button onClick={handleBack} className="w-full">
                  Try Different Email
                </Button>
              </Field>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

