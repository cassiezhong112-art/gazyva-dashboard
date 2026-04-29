export interface SimAdjustment {
  indication: string;
  indicationLabel: string;
  lever: string;
  leverKey: string;
  from: number;
  to: number;
  increase: number;
  unit: string;
  revGained: number;
  strategy: string;
  priority: number;
}

export interface MarketIntel {
  totalDiagnosed: number;
  biologicPenetration: number;
  competitorShare: number;
  source: string;
  diseaseArea: string;
  dataYear: string;
  keyFindings: string[];
}

export interface SimResult {
  year: number;
  currentRev: number;
  targetRev: number;
  achievedRev: number;
  achievedPct: number;
  gap: number;
  remaining: number;
  feasible: boolean;
  adjustments: SimAdjustment[];
  marketIntel: MarketIntel;
  overallStrategy: string;
}

export interface BaselineYear {
  totalRevenue: number;
  byIndication: Record<string, number>;
}
