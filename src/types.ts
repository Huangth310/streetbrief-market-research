export type CategoryKey = "coffee" | "light" | "tea" | "bakery" | "snack";

export type AnalysisMode = "targeted" | "discover";

export interface AnalysisInput {
  address: string;
  mode: AnalysisMode;
  category?: CategoryKey;
}

export type OpportunityType = "gap" | "mature_entry" | "insufficient";

export type Confidence = "high" | "medium" | "low";

export type EvidenceGrade = "A" | "B" | "C";

export interface AreaLandmark {
  type: string;
  count: number;
  nearestM: number;
  names: string[];
  evidenceId: string;
}

export interface Evidence {
  id: string;
  title: string;
  source: string;
  sourceType:
    | "map-sample"
    | "public-page-sample"
    | "review-sample"
    | "map-api"
    | "public-web";
  capturedAt: string;
  grade: EvidenceGrade;
  excerpt: string;
  summary?: string;
  highlights?: string[];
  field: string;
  url?: string;
  synthetic: boolean;
}

export interface Competitor {
  id: string;
  name: string;
  categoryLabel: string;
  lat: number;
  lng: number;
  distanceM: number;
  rating: number | null;
  reviewCount: number | null;
  hours: string | null;
  priceBand: string | null;
  concept: string;
  tactics: string[];
  completeness: number;
  evidenceIds: string[];
}

export interface CustomerSegment {
  id: string;
  level: "core" | "secondary" | "potential";
  title: string;
  description: string;
  evidenceIds: string[];
}

export interface MarketFact {
  id: string;
  layer: "fact" | "proxy" | "inference";
  title: string;
  detail: string;
  implication: string;
  confidence: Confidence;
  evidenceIds: string[];
}

export interface Opportunity {
  id: string;
  type: OpportunityType;
  title: string;
  summary: string;
  rationale: string;
  caution: string;
  confidence: Confidence;
  evidenceIds: string[];
}

export interface Recommendation {
  id: string;
  area: "定位" | "产品" | "价格" | "时段" | "渠道";
  title: string;
  detail: string;
  verification: string;
  evidenceIds: string[];
}

export interface CategoryRank {
  category: CategoryKey;
  label: string;
  score: number;
  potentialScore: number;
  breakdown: {
    demand: number;
    competition: number;
    scenario: number;
    differentiation: number;
    evidence: number;
  };
  confidence: Confidence;
  missingData: string[];
  opportunity: OpportunityType;
  labelText: string;
  note: string;
}

export interface CategoryProfile {
  category: CategoryKey;
  label: string;
  shortLabel: string;
  score: number;
  potentialScore: 1 | 2 | 3 | 4 | 5;
  decisionLabel: string;
  headline: string;
  summary: string;
  categoryBoundary: string;
  coverage: number;
  priceBand: string;
  openingHint: string;
  opportunity: OpportunityType;
  opportunityTitle: string;
  opportunitySummary: string;
  opportunityCaution: string;
  recommendation: {
    positioning: string;
    product: string;
    price: string;
    hours: string;
    channel: string;
  };
}

export interface Report {
  id: string;
  version: string;
  dataMode: "demo" | "live";
  generatedAt: string;
  analysisSummary: string;
  input: AnalysisInput;
  category: CategoryKey;
  profile: CategoryProfile;
  center: {
    lat: number;
    lng: number;
    label: string;
    precisionNote?: string;
  };
  radii: {
    core: number;
    max: number;
  };
  coverage: number;
  competitors: Competitor[];
  landmarks: AreaLandmark[];
  segments: CustomerSegment[];
  facts: MarketFact[];
  opportunities: Opportunity[];
  recommendations: Recommendation[];
  ranking: CategoryRank[];
  evidence: Evidence[];
  limitations: string[];
  sample: boolean;
  diagnostics?: {
    broadPoiCount: number;
    directCompetitorCount: number;
    webEvidenceCount: number;
    priceCoveredCount: number;
    anchorCount: number;
  };
  cacheHit?: boolean;
}
