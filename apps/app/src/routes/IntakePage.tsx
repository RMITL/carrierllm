import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Banner, Card, Button } from '@carrierllm/ui';
import { OrionIntakeForm } from '../features/intake/OrionIntakeForm';
import { submitOrionIntake, getUserUsage } from '../lib/api';
import { useFeatureAccess } from '../components/auth/FeatureGates';
import type { OrionIntake } from '../types';
import { useEffect, useState, useMemo } from 'react';

export const IntakePage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { has } = useAuth();
  const { getPlanLimits } = useFeatureAccess();

  // Fetch real usage data from API
  const { data: usageData, isLoading: usageLoading, refetch: refetchUsage } = useQuery({
    queryKey: ['user-usage', user?.id],
    queryFn: getUserUsage,
    enabled: !!user?.id,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  // Memoize plan limits to prevent infinite re-renders
  const limits = useMemo(() => getPlanLimits(), [has]);

  // Use API data if available, fallback to feature gates
  const usage = useMemo(() => {
    if (usageData) {
      return {
        used: usageData.recommendationsUsed,
        limit: usageData.recommendationsLimit === -1 ? 999 : usageData.recommendationsLimit
      };
    }
    // Fallback to feature gates if API data not available
    return {
      used: user?.publicMetadata?.monthlyUsage as number || 0,
      limit: limits.recommendations === -1 ? 999 : limits.recommendations
    };
  }, [usageData, user, limits.recommendations]);

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: submitOrionIntake,
    onSuccess: async (data) => {
      console.log('Intake submission successful, data:', data);
      console.log('Recommendation ID:', data.recommendationId);
      
      // Refetch usage data to get updated count from API
      await refetchUsage();
      
      if (data.recommendationId) {
        navigate(`/results/${data.recommendationId}`, { state: data });
      } else {
        console.error('No recommendationId in response:', data);
        // Fallback navigation
        navigate('/results/error', { state: { error: 'No recommendation ID received' } });
      }
    },
    onError: (error) => {
      console.error('Intake submission failed:', error);
    }
  });

  const handleSubmit = async (intake: OrionIntake) => {
    console.log('IntakePage: handleSubmit called with intake:', intake);
    console.log('IntakePage: Usage check - used:', usage.used, 'limit:', usage.limit);
    
    // Check if user has reached limit
    if (usage.used >= usage.limit) {
      console.log('IntakePage: User has reached limit, not submitting');
      return;
    }
    
    console.log('IntakePage: Calling mutateAsync');
    try {
      await mutateAsync(intake);
      console.log('IntakePage: mutateAsync completed successfully');
    } catch (error) {
      console.error('IntakePage: mutateAsync failed:', error);
    }
  };

  const hasReachedLimit = usage.used >= usage.limit;
  const isApproachingLimit = usage.limit > 0 && (usage.limit - usage.used) <= 5;
  const usagePercentage = usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[color:var(--color-gray-900)]">
          Intake: 8 carrier knockout questions
        </h1>
        <p className="text-sm text-[color:var(--color-gray-500)]">
          Capture the minimum viable underwriting data to generate a carrier fit score with citations.
        </p>
      </header>

      {/* Usage indicator */}
      {usage.limit > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Monthly Recommendations
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {usageLoading ? 'Loading...' : `${usage.used} of ${usage.limit === 999 ? '∞' : usage.limit} used`}
              </p>
              {usageData && (
                <p className="text-xs text-blue-600 mt-1">
                  Plan: {usageData.plan} • Status: {usageData.status}
                </p>
              )}
            </div>
            {isApproachingLimit && !hasReachedLimit && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/pricing')}
              >
                Upgrade Plan
              </Button>
            )}
          </div>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(100, usagePercentage)}%`
              }}
            />
          </div>
          {isApproachingLimit && !hasReachedLimit && (
            <p className="text-xs text-orange-600 mt-2">
              You're approaching your monthly limit. Consider upgrading to avoid interruptions.
            </p>
          )}
        </Card>
      )}

      {/* Limit reached warning */}
      {hasReachedLimit && (
        <Banner
          variant="warning"
          title="Monthly limit reached"
          description="You've used all your recommendations for this month. Upgrade your plan to continue."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/pricing')}
            >
              Upgrade Now
            </Button>
          }
        />
      )}

      {/* Premium features notice for free users */}
      {has?.({ plan: 'free_user' }) && (
        <Banner
          variant="info"
          title="Unlock Premium Features"
          description="Upgrade to get more recommendations, priority processing, and advanced analytics."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/pricing')}
            >
              View Plans
            </Button>
          }
        />
      )}

      {isError ? (
        <Banner
          variant="error"
          title="Recommendation service error"
          description={`Failed to process intake: ${error?.message || 'Unknown error'}. Please try again.`}
        />
      ) : null}

      <OrionIntakeForm
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        disabled={hasReachedLimit}
      />
    </div>
  );
};