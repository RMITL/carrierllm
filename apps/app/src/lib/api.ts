import axios, { AxiosError } from 'axios';
import type {
  OrionIntake,
  OrionRecommendationResponse,
  IntakeAnswers,
  RecommendationResponse,
  AnalyticsSummary
} from '../types';

// Create different timeout configs for different types of requests
const TIMEOUTS = {
  default: 30000, // 30 seconds for most API calls
  intake: 300000, // 5 minutes for intake processing with RAG
  analytics: 15000, // 15 seconds for analytics
};

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'https://app.carrierllm.com/api',
  timeout: TIMEOUTS.default,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor for Clerk integration
client.interceptors.request.use(async (config) => {
  try {
    // Get the Clerk token and user ID for authenticated requests
    const token = await (window as any).Clerk?.session?.getToken();
    const userId = (window as any).Clerk?.user?.id;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (userId) {
      config.headers['X-User-Id'] = userId;
    }

    console.log('API Request:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      userId: userId
    });
  } catch (error) {
    console.warn('Failed to get Clerk auth info:', error);
    // Don't fail the request if auth info retrieval fails
  }
  return config;
});

// Enhanced response interceptor with better error handling
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Log errors for debugging but don't expose sensitive data
    if (error.response) {
      console.error(`API Error ${error.response.status}:`, {
        url: error.config?.url,
        status: error.response.status,
        message: error.response.data || error.message
      });
    } else if (error.request) {
      console.error('Network Error:', {
        url: error.config?.url,
        message: 'No response received from server'
      });
    } else {
      console.error('Request Setup Error:', error.message);
    }
    throw error;
  }
);

// Helper function for retry logic
const withRetry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && (error as AxiosError).response?.status !== 401) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

/**
 * Submit Orion intake and get carrier recommendations
 */
export const submitOrionIntake = async (intake: OrionIntake): Promise<OrionRecommendationResponse> => {
  return withRetry(async () => {
    const response = await client.post<OrionRecommendationResponse>('/intake/submit', intake, {
      timeout: TIMEOUTS.intake
    });
    return response.data;
  });
};

/**
 * Submit legacy intake (backward compatibility)
 */
export const submitIntake = async (answers: IntakeAnswers): Promise<RecommendationResponse> => {
  return withRetry(async () => {
    const response = await client.post<RecommendationResponse>('/intake/submit', { answers }, {
      timeout: TIMEOUTS.intake
    });
    return response.data;
  });
};

/**
 * Get recommendation by ID
 */
export const fetchRecommendations = async (submissionId: string): Promise<RecommendationResponse> => {
  return withRetry(async () => {
    const response = await client.get<RecommendationResponse>(`/recommendations/${submissionId}`);
    return response.data;
  });
};

/**
 * Get Orion recommendation by ID
 */
export const fetchOrionRecommendation = async (recommendationId: string): Promise<OrionRecommendationResponse> => {
  return withRetry(async () => {
    const response = await client.get<OrionRecommendationResponse>(`/recommendations/${recommendationId}`);
    return response.data;
  });
};

/**
 * Get analytics summary for dashboard
 */
export const fetchAnalytics = async (): Promise<AnalyticsSummary> => {
  try {
    const response = await client.get<AnalyticsSummary>('/analytics/summary', {
      timeout: TIMEOUTS.analytics
    });
    
    // Check if response is HTML (indicates wrong endpoint)
    if (typeof response.data === 'string' && (response.data as string).includes('<!DOCTYPE html>')) {
      console.warn('API returned HTML instead of JSON - endpoint may not exist');
      throw new Error('API endpoint not found');
    }
    
    console.log('Analytics API response:', response.data);
    return response.data;
  } catch (error) {
    // If API is not available, return default analytics data
    console.warn('Analytics API not available, returning default data:', error);
    return {
      stats: {
        totalIntakes: 0,
        averageFitScore: 0,
        placementRate: 0,
        remainingRecommendations: 5
      }
    } as AnalyticsSummary;
  }
};

/**
 * Log recommendation outcome (placement/decline)
 */
export const logOutcome = async (
  recommendationId: string,
  carrierId: string,
  outcome: 'placed' | 'declined'
): Promise<void> => {
  return withRetry(async () => {
    await client.post('/outcomes', {
      recommendationId,
      carrierId,
      outcome,
    });
  });
};

/**
 * Get user subscription status and usage
 */
export const getUserUsage = async (): Promise<{
  plan: string;
  status: string;
  recommendationsUsed: number;
  recommendationsLimit: number;
}> => {
  return withRetry(async () => {
    const userId = (window as any).Clerk?.user?.id;
    if (!userId) {
      // Return free tier defaults if not logged in
      return {
        plan: 'Free',
        status: 'active',
        recommendationsUsed: 0,
        recommendationsLimit: 5
      };
    }

    const response = await client.get(`/subscriptions/${userId}`);
    const subscription = response.data;

    // Map subscription data to expected format
    return {
      plan: subscription.planKey === 'free_user' ? 'Free' :
            subscription.planKey === 'individual' ? 'Individual' :
            subscription.planKey === 'free_org' ? 'Team Free' :
            subscription.planKey === 'enterprise' ? 'Enterprise' : 'Free',
      status: subscription.status,
      recommendationsUsed: subscription.usage.recommendationsUsed,
      recommendationsLimit: subscription.usage.recommendationsLimit
    };
  });
};

/**
 * Get user's recent activity
 */
export const getRecentActivity = async (): Promise<Array<{
  id: string;
  type: string;
  description: string;
  timestamp: string;
}>> => {
  return withRetry(async () => {
    const response = await client.get('/user/recent-activity');
    return response.data;
  });
};

/**
 * Update user profile information
 */
export const updateUserProfile = async (profileData: {
  companyName?: string;
  licenseNumber?: string;
  phone?: string;
  address?: string;
}): Promise<void> => {
  return withRetry(async () => {
    await client.put('/user/profile', profileData);
  });
};

/**
 * Get user history of intakes and recommendations
 */
export const getUserHistory = async (): Promise<Array<{
  id: string;
  recommendationId?: string;
  type: 'intake' | 'recommendation';
  data: any;
  createdAt: string;
  status?: string;
  summary?: {
    averageFit?: number;
    eligibleCarriers?: number;
    topCarrierId?: string;
  };
}>> => {
  return withRetry(async () => {
    const userId = (window as any).Clerk?.user?.id;
    if (!userId) {
      return [];
    }

    const response = await client.get(`/user/${userId}/history`);
    return response.data;
  });
};

/**
 * Health check to test API connectivity
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await client.get('/health', { timeout: 5000 });
    console.log('API Health check successful:', response.status);
    return true;
  } catch (error) {
    console.warn('API Health check failed:', error);
    return false;
  }
};

export const api = client;
export default client;
