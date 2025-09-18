import axios from 'axios';
// Create different timeout configs for different types of requests
const TIMEOUTS = {
    default: 30000, // 30 seconds for most API calls
    intake: 300000, // 5 minutes for intake processing with RAG
    analytics: 15000, // 15 seconds for analytics
};
const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8787/api',
    timeout: TIMEOUTS.default,
    headers: {
        'Content-Type': 'application/json',
    },
});
// Add auth interceptor for Clerk integration
client.interceptors.request.use(async (config) => {
    try {
        // Get the Clerk token and user ID for authenticated requests
        const token = await window.Clerk?.session?.getToken();
        const userId = window.Clerk?.user?.id;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        if (userId) {
            config.headers['X-User-Id'] = userId;
        }
    }
    catch (error) {
        console.warn('Failed to get Clerk auth info:', error);
        // Don't fail the request if auth info retrieval fails
    }
    return config;
});
// Enhanced response interceptor with better error handling
client.interceptors.response.use((response) => response, (error) => {
    // Log errors for debugging but don't expose sensitive data
    if (error.response) {
        console.error(`API Error ${error.response.status}:`, {
            url: error.config?.url,
            status: error.response.status,
            message: error.response.data || error.message
        });
    }
    else if (error.request) {
        console.error('Network Error:', {
            url: error.config?.url,
            message: 'No response received from server'
        });
    }
    else {
        console.error('Request Setup Error:', error.message);
    }
    throw error;
});
// Helper function for retry logic
const withRetry = async (fn, retries = 3, delay = 1000) => {
    try {
        return await fn();
    }
    catch (error) {
        if (retries > 0 && error.response?.status !== 401) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return withRetry(fn, retries - 1, delay * 2);
        }
        throw error;
    }
};
/**
 * Submit Orion intake and get carrier recommendations
 */
export const submitOrionIntake = async (intake) => {
    return withRetry(async () => {
        const response = await client.post('/intake/submit', intake, {
            timeout: TIMEOUTS.intake
        });
        return response.data;
    });
};
/**
 * Submit legacy intake (backward compatibility)
 */
export const submitIntake = async (answers) => {
    return withRetry(async () => {
        const response = await client.post('/intake/submit', { answers }, {
            timeout: TIMEOUTS.intake
        });
        return response.data;
    });
};
/**
 * Get recommendation by ID
 */
export const fetchRecommendations = async (submissionId) => {
    return withRetry(async () => {
        const response = await client.get(`/recommendations/${submissionId}`);
        return response.data;
    });
};
/**
 * Get Orion recommendation by ID
 */
export const fetchOrionRecommendation = async (recommendationId) => {
    return withRetry(async () => {
        const response = await client.get(`/recommendations/${recommendationId}`);
        return response.data;
    });
};
/**
 * Get analytics summary for dashboard
 */
export const fetchAnalytics = async () => {
    return withRetry(async () => {
        const response = await client.get('/analytics/summary', {
            timeout: TIMEOUTS.analytics
        });
        return response.data;
    });
};
/**
 * Log recommendation outcome (placement/decline)
 */
export const logOutcome = async (recommendationId, carrierId, outcome) => {
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
export const getUserUsage = async () => {
    return withRetry(async () => {
        const userId = window.Clerk?.user?.id;
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
export const getRecentActivity = async () => {
    return withRetry(async () => {
        const response = await client.get('/user/recent-activity');
        return response.data;
    });
};
/**
 * Update user profile information
 */
export const updateUserProfile = async (profileData) => {
    return withRetry(async () => {
        await client.put('/user/profile', profileData);
    });
};
/**
 * Get user history of intakes and recommendations
 */
export const getUserHistory = async () => {
    return withRetry(async () => {
        const userId = window.Clerk?.user?.id;
        if (!userId) {
            return [];
        }
        const response = await client.get(`/user/${userId}/history`);
        return response.data;
    });
};
export const api = client;
export default client;
