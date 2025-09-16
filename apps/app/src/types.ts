export type IntakeAnswers = {
  dob: string;
  state: string;
  coverageStart: string;
  replacingCoverage: boolean;
  nicotineUse: 'never' | 'past24Months' | 'current';
  majorConditions: string;
  prescriptions: string;
  height: number;
  weight: number;
  riskActivities: string;
  householdIncome?: number;
  occupation?: string;
  coverageType: 'health' | 'life';
};

export type IntakeSubmission = {
  id: string;
  createdAt: string;
  answers: IntakeAnswers;
};

export type CarrierRecommendation = {
  carrierId: string;
  carrierName: string;
  program: string;
  fitPercent: number;
  reasons: string[];
  citations: { title: string; url: string }[];
  underwritingNotes: string;
  status: 'strong' | 'consider' | 'avoid';
};

export type RecommendationSummary = {
  topCarrierId: string;
  averageFit: number;
  notes: string;
};

export type RecommendationResponse = {
  submissionId: string;
  recommendations: CarrierRecommendation[];
  summary: RecommendationSummary;
};

export type AnalyticsSummary = {
  totalSubmissions: number;
  averageFit: number;
  placementRate: number;
  lastUpdated: string;
};
