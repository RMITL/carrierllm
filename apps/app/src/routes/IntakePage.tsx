import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Banner, Card, Button } from '@carrierllm/ui';
import { OrionIntakeForm } from '../features/intake/OrionIntakeForm';
import { submitOrionIntake } from '../lib/api';
import { useFeatureAccess } from '../components/auth/FeatureGates';
import type { OrionIntake } from '../types';
import { useEffect, useState } from 'react';

export const IntakePage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { has } = useAuth();
  const { getPlanLimits } = useFeatureAccess();
  const [usage, setUsage] = useState({ used: 0, limit: 5 });

  // Get plan limits
  const limits = getPlanLimits();

  useEffect(() => {
    // Fetch current usage from user metadata
    const currentUsage = user?.publicMetadata?.monthlyUsage as number || 0;
    setUsage({
      used: currentUsage,
      limit: limits.recommendations === -1 ? 999 : limits.recommendations
    });
  }, [user, limits]);

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: submitOrionIntake,
    onSuccess: async (data) => {
      // Update usage count in user metadata
      if (user) {
        await user.update({
          publicMetadata: {
            ...user.publicMetadata,
            monthlyUsage: (usage.used || 0) + 1
          }
        });
      }
      navigate(`/results/${data.recommendationId}`, { state: data });
    }
  });

  const handleSubmit = async (intake: OrionIntake) => {
    // Check if user has reached limit
    if (usage.used >= usage.limit) {
      return;
    }
    await mutateAsync(intake);
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
                {usage.used} of {usage.limit} used
              </p>
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