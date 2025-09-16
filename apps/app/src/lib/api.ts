import axios from 'axios';
import type {
  IntakeAnswers,
  RecommendationResponse,
  AnalyticsSummary
} from '../types';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 5000
});

export const submitIntake = async (answers: IntakeAnswers) => {
  const response = await client.post<RecommendationResponse>('/intake/submit', { answers });
  return response.data;
};

export const fetchRecommendations = async (submissionId: string) => {
  const response = await client.get<RecommendationResponse>(`/recommendations/${submissionId}`);
  return response.data;
};

export const fetchAnalytics = async () => {
  const response = await client.get<AnalyticsSummary>('/analytics/summary');
  return response.data;
};
