import { Protect, useAuth } from '@clerk/clerk-react';
import { ReactNode } from 'react';
import { Card, Button } from '@carrierllm/ui';
import { useNavigate } from 'react-router-dom';

interface PlanGateProps {
  children: ReactNode;
  plan: 'free_user' | 'individual' | 'free_org' | 'enterprise';
  fallback?: ReactNode;
}

/**
 * Gate content by plan using Clerk's native Protect component
 */
export const PlanGate = ({ children, plan, fallback }: PlanGateProps) => {
  const navigate = useNavigate();

  const defaultFallback = (
    <Card className="max-w-md mx-auto my-8">
      <div className="p-6 text-center">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-yellow-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upgrade Required
        </h3>
        <p className="text-gray-600 mb-4">
          This feature requires the {plan} plan or higher.
        </p>
        <Button
          variant="primary"
          onClick={() => navigate('/pricing')}
        >
          View Plans
        </Button>
      </div>
    </Card>
  );

  return (
    <Protect
      plan={plan}
      fallback={fallback || defaultFallback}
    >
      {children}
    </Protect>
  );
};

interface FeatureGateProps {
  children: ReactNode;
  feature: string;
  fallback?: ReactNode;
}

/**
 * Gate content by feature using Clerk's native Protect component
 */
export const FeatureGate = ({ children, feature, fallback }: FeatureGateProps) => {
  const defaultFallback = (
    <div className="relative">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
        <div className="text-center p-4">
          <svg
            className="w-8 h-8 mx-auto mb-2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p className="text-sm font-medium text-gray-700 mb-1">Premium Feature</p>
          <p className="text-xs text-gray-500">Upgrade to unlock</p>
        </div>
      </div>
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
    </div>
  );

  return (
    <Protect
      feature={feature}
      fallback={fallback || defaultFallback}
    >
      {children}
    </Protect>
  );
};

/**
 * Hook to check feature/plan access programmatically
 */
export const useFeatureAccess = () => {
  const { has } = useAuth();

  const checkPlan = (plan: string): boolean => {
    return has?.({ plan }) || false;
  };

  const checkFeature = (feature: string): boolean => {
    return has?.({ feature }) || false;
  };

  const getPlanLimits = (): {
    recommendations: number;
    teamMembers: number;
  } => {
    // Check plans from highest to lowest tier
    if (has?.({ plan: 'enterprise' })) {
      return { recommendations: -1, teamMembers: 5 }; // unlimited recommendations, 5 seats included
    }
    if (has?.({ plan: 'individual' })) {
      return { recommendations: 100, teamMembers: 1 }; // Higher limit for $50/month
    }
    if (has?.({ plan: 'free_org' })) {
      return { recommendations: 10, teamMembers: 2 };
    }
    // Default to free_user
    return { recommendations: 5, teamMembers: 1 };
  };

  const getPricing = () => {
    return {
      individual: 50,
      enterprise: 150,
      extra_team_seat: 30,
      free_user: 0,
      free_org: 0
    };
  };

  return {
    checkPlan,
    checkFeature,
    getPlanLimits,
    getPricing
  };
};