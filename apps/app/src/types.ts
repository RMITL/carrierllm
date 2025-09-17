// Orion's 8 Core Questions
export type OrionCoreIntake = {
  age: number;
  state: string;
  height: number; // inches
  weight: number; // pounds
  nicotine: {
    lastUse: 'never' | 'past24Months' | 'current';
    type?: 'cigarettes' | 'vape' | 'cigars' | 'chew' | 'nrt'; // nicotine replacement therapy
    frequency?: string;
  };
  marijuana: {
    lastUse: 'never' | 'past12Months' | 'current';
    type?: 'smoke' | 'vape' | 'edible';
    frequency?: string;
    medical?: boolean;
  };
  cardiac?: {
    hasHistory: boolean;
    conditions?: Array<'mi' | 'stents' | 'angina' | 'chf'>;
    details?: string;
  };
  diabetes?: {
    hasCondition: boolean;
    type?: 'type1' | 'type2';
    a1c?: number;
    medications?: string;
    complications?: Array<'neuropathy' | 'retinopathy'>;
  };
  cancer?: {
    hasHistory: boolean;
    type?: string;
    stage?: string;
    treatmentDate?: string;
  };
  drivingAndRisk: {
    duiHistory?: boolean;
    duiCount?: number;
    duiDates?: string[];
    riskActivities?: Array<'aviation' | 'scuba' | 'racing' | 'climbing'>;
    details?: string;
  };
  coverageTarget: {
    amount: number;
    type: 'iul' | 'term' | 'annuity';
  };
};

// Tier-2 Expanded Questions (triggered by conditions)
export type OrionTier2Intake = {
  diabetesExpanded?: {
    diagnosisDate: string;
    latestA1c: number;
    a1cDate: string;
    medications: string;
    compliance: 'excellent' | 'good' | 'fair' | 'poor';
    complications: string[];
  };
  cardiacExpanded?: {
    eventType: string;
    eventDate: string;
    interventions: string[];
    lastEcho?: string;
    lastStressTest?: string;
    ejectionFraction?: number;
    currentMedications: string;
    bpControl: boolean;
    cholesterolControl: boolean;
  };
  cancerExpanded?: {
    site: string;
    stage: string;
    grade: string;
    treatmentTimeline: string;
    surveillanceStatus: string;
  };
  nicotineExpanded?: {
    product: string;
    frequency: string;
    nrtType?: string;
    nrtDose?: string;
    nrtFrequency?: string;
    nrtDuration?: string;
    lastNrtUse?: string;
  };
  marijuanaExpanded?: {
    form: 'smoke' | 'vape' | 'edible';
    frequency: string;
    lastUse: string;
    medical: boolean;
    prescription?: string;
  };
  duiExpanded?: {
    dates: string[];
    count: number;
    licenseStatus: 'valid' | 'suspended' | 'revoked';
    circumstances: string;
  };
  avocationsExpanded?: {
    type: string;
    certificationLevel?: string;
    frequency: string;
    details: string; // depth/speeds/heights
  };
  financialExpanded?: {
    income: number;
    netWorth: number;
    justification: string;
    estateNeed: boolean;
    keyPerson: boolean;
  };
};

export type OrionIntake = {
  core: OrionCoreIntake;
  tier2?: OrionTier2Intake;
  validated: boolean;
  tier2Triggered: boolean;
};

// Legacy type for backward compatibility
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

export type CarrierCitation = {
  chunkId: string;
  snippet: string;
  documentTitle: string;
  effectiveDate: string;
  page?: number;
  section?: string;
};

export type CarrierRecommendation = {
  carrierId: string;
  carrierName: string;
  product: string;
  fitPct: number;
  confidence?: 'low' | 'medium' | 'high';
  reasons: string[];
  declines?: string[];
  citations: CarrierCitation[];
  advisories?: string[];
  apsLikely?: boolean;
  ctas?: {
    portalUrl: string;
    agentPhone: string;
  };
  // Legacy fields for backward compatibility
  program?: string;
  fitPercent?: number; // Legacy field - same as fitPct
  underwritingNotes?: string;
  status?: 'strong' | 'consider' | 'avoid';
};

export type IulGuidance = {
  type: 'IUL';
  monthly: number; // age × 10 rule
  note: string;
};

export type RecommendationSummary = {
  topCarrierId: string;
  averageFit: number;
  notes: string;
};

export type OrionRecommendationResponse = {
  recommendationId: string;
  top: CarrierRecommendation[];
  stretch?: CarrierRecommendation;
  premiumSuggestion?: IulGuidance;
  summary: RecommendationSummary;
};

// Legacy type for backward compatibility
export type RecommendationResponse = {
  submissionId: string;
  recommendations: CarrierRecommendation[];
  summary: RecommendationSummary;
};

export type AnalyticsSummary = {
  stats: {
    totalRecommendations: number;
    totalIntakes: number;
    remainingRecommendations: number;
    averageFitScore: number;
    placementRate: number;
  };
  user: {
    subscriptionTier: string;
    subscriptionStatus: string;
    recommendationsUsed: number;
    recommendationsLimit: number;
  };
  topCarriers?: Array<{
    carrierId: string;
    carrierName: string;
    recommendations: number;
    averageFit: number;
    placements: number;
  }>;
  trends?: Array<{
    month: string;
    recommendations: number;
    placements: number;
  }>;
  lastUpdated: string;
};
