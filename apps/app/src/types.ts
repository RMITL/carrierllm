// Core domain types
export interface IntakeAnswers {
  dob: string;
  state: string;
  coverageStart: string;
  replacingCoverage: boolean;
  nicotineUse: 'never' | 'past24Months' | 'current';
  majorConditions: string;
  prescriptions: string;
  height: number; // inches
  weight: number; // lbs
  riskActivities: string;
  householdIncome?: number;
  occupation?: string;
  coverageType: 'health' | 'life';
}

export interface CarrierRecommendation {
  carrierId: string;
  carrierName: string;
  carrierLogo?: string;
  fitScore: number;
  reasoning: {
    pros: string[];
    cons: string[];
    summary: string;
  };
  estimatedPremium?: {
    monthly: number;
    annual: number;
  };
  confidence: 'high' | 'medium' | 'low';
  citations: Array<{
    chunkId: string;
    snippet: string;
    documentTitle: string;
    effectiveDate: string;
    page?: number;
    section?: string;
    score: number;
  }>;
}

// Additional type exports for backward compatibility
export type CarrierCitation = CarrierRecommendation['citations'][0];
export type RecommendationSummary = RecommendationResponse['summary'];

export interface RecommendationResponse {
  submissionId: string;
  status: 'pending' | 'completed' | 'error';
  recommendations: CarrierRecommendation[];
  summary: {
    topPick?: string;
    topCarrierId?: string; // Add for backward compatibility
    averageFit: number;
    totalCarriersEvaluated: number;
    notes?: string; // Add for backward compatibility
  };
  timestamp: string;
  error?: string;
}

// Orion Intake types - new schema
export type NicotineLastUse = 'never' | 'past24Months' | 'current';
export type NicotineType = 'cigarettes' | 'vape' | 'cigars' | 'chew' | 'nrt';
export type MarijuanaLastUse = 'never' | 'past12Months' | 'current';
export type MarijuanaType = 'smoke' | 'vape' | 'edible';
export type CardiacCondition = 'mi' | 'stents' | 'angina' | 'chf';
export type DiabetesType = 'type1' | 'type2';
export type DiabetesComplications = 'neuropathy' | 'retinopathy';
export type RiskActivity = 'aviation' | 'scuba' | 'racing' | 'climbing';
export type CoverageType = 'iul' | 'term' | 'annuity';

export interface OrionCore {
  age: number;
  state: string;
  height: number; // inches
  weight: number; // lbs

  nicotine: {
    lastUse: NicotineLastUse;
    type?: NicotineType;
    frequency?: string;
  };

  marijuana: {
    lastUse: MarijuanaLastUse;
    type?: MarijuanaType;
    frequency?: string;
    medical?: boolean;
  };

  cardiac?: {
    hasHistory: boolean;
    conditions?: CardiacCondition[];
    details?: string;
  };

  diabetes?: {
    hasCondition: boolean;
    type?: DiabetesType;
    a1c?: number;
    medications?: string;
    complications?: DiabetesComplications[];
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
    riskActivities?: RiskActivity[];
    details?: string;
  };

  coverageTarget: {
    amount: number;
    type: CoverageType;
  };
}

// Alias for OrionCore for backward compatibility
export type OrionCoreIntake = OrionCore;

export interface OrionIntake {
  core: OrionCore;
  tier2?: any; // Will expand this for tier-2 fields later
  validated: boolean;
  tier2Triggered: boolean;
}

export interface OrionCarrierRecommendation {
  carrierId: string;
  carrierName: string;
  carrierLogo?: string;
  fitScore: number;
  tier: 'standard' | 'preferred' | 'preferred_plus' | 'standard_plus' | 'substandard';
  reasoning: {
    pros: string[];
    cons: string[];
    summary: string;
    knockoutFactors?: string[];
  };
  estimatedPremium?: {
    monthly: number;
    annual: number;
    confidence: 'high' | 'medium' | 'low';
  };
  underwritingPath: 'simplified' | 'accelerated' | 'traditional';
  requiresExam: boolean;
  processingTime: string; // e.g., "2-4 weeks", "instant"
  citations: Array<{
    chunkId: string;
    snippet: string;
    documentTitle: string;
    effectiveDate: string;
    page?: number;
    section?: string;
    score: number;
  }>;
  nextSteps?: string[];
}

// IUL specific guidance type
export interface IulGuidance {
  productType: 'iul' | 'term' | 'whole' | 'annuity';
  recommendation: string;
  benefits: string[];
  considerations: string[];
}

export interface OrionRecommendationResponse {
  recommendationId: string;
  status: 'pending' | 'completed' | 'error';
  intake: OrionIntake;
  recommendations: OrionCarrierRecommendation[];
  // Legacy properties for backward compatibility
  top?: OrionCarrierRecommendation[];
  stretch?: OrionCarrierRecommendation[];
  premiumSuggestion?: string;
  summary: {
    topPick?: string;
    topCarrierId?: string; // Add for backward compatibility
    averageFit: number;
    totalCarriersEvaluated: number;
    tier2Recommended: boolean;
    knockoutsSummary?: string[];
    notes?: string; // Add for backward compatibility
  };
  metadata: {
    processingTime: number; // ms
    ragQueriesCount: number;
    citationsFound: number;
    modelUsed: string;
  };
  timestamp: string;
  error?: string;
}

// Analytics types
export type AnalyticsSummary = {
  stats: {
    totalIntakes: number;
    averageFitScore: number;
    placementRate: number;
    remainingRecommendations: number;
  };
  topCarriers?: Array<{
    id: string;
    name: string;
    count: number;
    successRate: number;
  }>;
  trends?: Array<{
    month: string;
    intakes: number;
    conversions: number;
    conversionRate: number;
  }>;
  lastUpdated: string;
};

// User activity types
export interface RecentActivity {
  id: string;
  type: 'intake_submitted' | 'recommendation_viewed' | 'outcome_logged';
  description: string;
  timestamp: string;
  metadata?: {
    intakeId?: string;
    recommendationId?: string;
    carrierId?: string;
    outcome?: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  licenseNumber?: string;
  phone?: string;
  address?: string;
  role: 'agent' | 'admin' | 'manager';
  createdAt: string;
  lastActive: string;
}

// Carrier management types
export interface Carrier {
  id: string;
  name: string;
  amBest?: string;
  portalUrl?: string;
  agentPhone?: string;
  preferredTierRank?: number;
  availableStates?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserCarrierPreference {
  id: string;
  userId: string;
  carrierId: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationCarrierSetting {
  id: string;
  organizationId: string;
  carrierId: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CarrierWithPreferences extends Carrier {
  userEnabled: boolean;
  organizationEnabled: boolean;
  isOrganizationControlled: boolean;
}

// Document upload types
export interface UserDocument {
  id: string;
  userId: string;
  carrierId: string;
  title: string;
  filename: string;
  r2Key: string;
  fileSize?: number;
  contentType?: string;
  docType: 'underwriting_guide' | 'build_chart' | 'program_flyer' | 'other';
  effectiveDate?: string;
  version: string;
  processed: boolean;
  createdAt: string;
}

export interface DocumentUploadRequest {
  carrierId: string;
  carrierName: string;
  title: string;
  file: File;
  docType: 'underwriting_guide' | 'build_chart' | 'program_flyer' | 'other';
  effectiveDate?: string;
}

export interface DocumentUploadResponse {
  success: boolean;
  documentId?: string;
  error?: string;
  message?: string;
}