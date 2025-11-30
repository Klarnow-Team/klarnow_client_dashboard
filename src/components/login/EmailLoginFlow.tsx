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
        setError('This email is not registered. Please contact support to get access.')
        setIsLoading(false)
        return
      }

      // User exists
      setUserData(data)
      
      // If available_kit_types exist, use the first one as default
      // Otherwise use preferred_kit or kit_type
      if (data.available_kit_types && data.available_kit_types.length > 0) {
        setSelectedKitType(data.available_kit_types[0])
      } else if (data.quiz_submission?.preferred_kit) {
        const preferredKit = data.quiz_submission.preferred_kit.toUpperCase() as 'LAUNCH' | 'GROWTH'
        setSelectedKitType(preferredKit)
      } else if (data.kit_type) {
        // Otherwise use kit_type from existing user data
        setSelectedKitType(data.kit_type)
      }
      
      setStep('user-found')
      setIsLoading(false)
    } catch (err: any) {
      setStep('error')
      setError(err.message || 'An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const handleContinue = () => {
    // Use selected kit type (either from userData or user selection)
    const kitType = selectedKitType || userData?.kit_type
    
    if (!userData || !kitType) {
      setError('Please select a plan to continue.')
      return
    }

    // Store user session in localStorage
    const sessionData = {
      email,
      name: userData.name || null,
      kit_type: kitType,
      kitType: kitType, // Also store as kitType for backward compatibility
      onboarding_finished: userData.onboarding_finished || false,
    }
    localStorage.setItem('user', JSON.stringify(sessionData))
    localStorage.setItem('isAuthenticated', 'true')

    // Redirect based on onboarding status
    if (userData.onboarding_finished) {
      // Skip onboarding, go to home or kit page
      router.push('/home')
    } else {
      // Go to onboarding Step 1
      const onboardingPath = kitType === 'LAUNCH'
        ? '/launch-kit/onboarding/step-1'
        : '/growth-kit/onboarding/step-1'
      router.push(onboardingPath)
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
                  Your Plan {userData.available_kit_types && userData.available_kit_types.length > 0 ? '' : <span className="text-red-500">*</span>}
                </FieldLabel>
                <Select
                  value={selectedKitType || userData.kit_type || ''}
                  onValueChange={(value) => setSelectedKitType(value as KitType)}
                >
                  <SelectTrigger 
                    id="kitType" 
                    className="w-full text-black"
                  >
                    <SelectValue placeholder={userData.available_kit_types && userData.available_kit_types.length > 0 ? "Select a plan..." : "No plans found"} />
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
                  {userData.available_kit_types && userData.available_kit_types.length > 0
                    ? `Plans associated with this email (${userData.available_kit_types.length} available)`
                    : 'Please select a plan to continue'}
                </FieldDescription>
              </Field>

              <Field>
                <Button
                  onClick={handleContinue}
                  className="w-full"
                >
                  Continue
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

