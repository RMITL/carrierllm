import axios from 'axios';
const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8787/api',
    timeout: 30000, // 30 seconds to meet P95 latency requirement
    headers: {
        'Content-Type': 'application/json',
    },
});
// Add auth interceptor for Clerk integration
client.interceptors.request.use(async (config) => {
    // In a real app, you'd get the Clerk token here
    // const token = await window.Clerk?.session?.getToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
});
// Response interceptor for error handling
client.interceptors.response.use((response) => response, (error) => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
});
/**
 * Submit Orion intake and get carrier recommendations
 */
export const submitOrionIntake = async (intake) => {
    const response = await client.post('/intake/submit', intake);
    return response.data;
};
/**
 * Submit legacy intake (backward compatibility)
 */
export const submitIntake = async (answers) => {
    const response = await client.post('/intake/submit', { answers });
    return response.data;
};
/**
 * Get recommendation by ID
 */
export const fetchRecommendations = async (submissionId) => {
    const response = await client.get(`/recommendations/${submissionId}`);
    return response.data;
};
/**
 * Get Orion recommendation by ID
 */
export const fetchOrionRecommendation = async (recommendationId) => {
    const response = await client.get(`/recommendations/${recommendationId}`);
    return response.data;
};
/**
 * Get analytics summary for dashboard
 */
export const fetchAnalytics = async () => {
    const response = await client.get('/analytics/summary');
    return response.data;
};
/**
 * Log recommendation outcome (placement/decline)
 */
export const logOutcome = async (recommendationId, carrierId, outcome) => {
    await client.post('/outcomes', {
        recommendationId,
        carrierId,
        outcome,
    });
};
/**
 * Get user subscription status and usage
 */
export const getUserUsage = async () => {
    const response = await client.get('/user/usage');
    return response.data;
};
export default client;
