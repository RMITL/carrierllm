import { SignIn, SignUp } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { Button } from '@carrierllm/ui';

export const AuthLayout = () => {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    // Check if a plan was selected before redirect
    const plan = localStorage.getItem('selectedPlanKey');
    if (plan) {
      setSelectedPlan(plan);
      setMode('sign-up');
    }
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="mx-auto max-w-md text-white">
          <h1 className="text-4xl font-bold tracking-tight mb-6">
            Welcome to CarrierLLM
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            The AI-powered insurance carrier placement platform that helps agents
            find the perfect match for their clients in seconds.
          </p>
          <div className="space-y-4 text-blue-100">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Instant carrier recommendations</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Evidence-backed decisions</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Higher placement rates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Authentication */}
      <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-12 lg:px-16 bg-white">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[color:var(--color-primary)]">
              CarrierLLM
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {mode === 'sign-in'
                ? 'Sign in to your account'
                : 'Create your account'
              }
            </p>
          </div>

          {/* Auth Toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <Button
              variant={mode === 'sign-in' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setMode('sign-in')}
              className="flex-1 bg-transparent border-0 shadow-none"
            >
              Sign In
            </Button>
            <Button
              variant={mode === 'sign-up' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setMode('sign-up')}
              className="flex-1 bg-transparent border-0 shadow-none"
            >
              Sign Up
            </Button>
          </div>

          {/* Clerk Authentication Components */}
          <div className="auth-component">
            {mode === 'sign-in' ? (
              <SignIn
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    card: 'shadow-none border-0 p-0',
                    formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
                    formFieldInput: 'rounded-md border-gray-300',
                    headerTitle: 'hidden',
                    headerSubtitle: 'hidden',
                  },
                  layout: {
                    socialButtonsPlacement: 'bottom',
                    socialButtonsVariant: 'blockButton',
                  }
                }}
                routing="hash"
                redirectUrl="/dashboard"
              />
            ) : (
              <SignUp
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    card: 'shadow-none border-0 p-0',
                    formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
                    formFieldInput: 'rounded-md border-gray-300',
                    headerTitle: 'hidden',
                    headerSubtitle: 'hidden',
                  },
                  layout: {
                    socialButtonsPlacement: 'bottom',
                    socialButtonsVariant: 'blockButton',
                  }
                }}
                routing="hash"
                redirectUrl="/dashboard"
                unsafeMetadata={{
                  planKey: selectedPlan || 'free_user'
                }}
              />
            )}
          </div>

          {/* Selected plan indicator */}
          {selectedPlan && selectedPlan !== 'free_user' && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 text-center">
                Selected Plan: <span className="font-semibold">{selectedPlan}</span>
              </p>
            </div>
          )}

          {/* Marketing footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              By signing up, you agree to our{' '}
              <a href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};