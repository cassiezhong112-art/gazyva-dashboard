import {
  type Indication, type FunnelParams,
  INDICATIONS, INDICATION_LABELS,
  getParamsForYear, calculateFunnel, calculateTotalRevenue,
} from './funnel-data';

// Lever definitions with caps and strategy templates
interface LeverDef {
  key: keyof FunnelParams;
  labelZh: string;
  labelEn: string;
  max: number;
  priority: number;
  strategyZh: string;
  strategyEn: string;
}

const LEVERS: LeverDef[] = [
  {
    key: 'gazyvaShare', labelZh: 'Gazyva 市场份额', labelEn: 'Gazyva Market Share',
    max: 80, priority: 1,
    strategyZh: '加强KOL合作与学术推广，提升处方占比；通过真实世界数据(RWE)建立循证优势',
    strategyEn: 'Strengthen KOL engagement & academic promotion; build evidence advantage through RWE',
  },
  {
    key: 'bxAdoption', labelZh: '生物制剂采纳率', labelEn: 'Biologic Adoption Rate',
    max: 90, priority: 2,
    strategyZh: '推动医保政策宣教，降低患者经济顾虑；联合学会发布生物制剂使用指南',
    strategyEn: 'Drive NRDL education, reduce cost concerns; co-publish biologic usage guidelines with societies',
  },
  {
    key: 'compliance', labelZh: '患者依从性', labelEn: 'Patient Compliance',
    max: 95, priority: 3,
    strategyZh: '建立患者管理项目(PAP)，强化随访与用药提醒；部署数字化患者教育平台',
    strategyEn: 'Establish PAP, strengthen follow-up & reminders; deploy digital patient education platform',
  },
  {
    key: 'urbanRate', labelZh: '城市覆盖率', labelEn: 'Urban Coverage Rate',
    max: 90, priority: 4,
    strategyZh: '拓展下沉市场准入，推动地市级医院挂网与DTP覆盖；建立区域转诊网络',
    strategyEn: 'Expand broad market access, drive city-level hospital listing & DTP; build regional referral network',
  },
  {
    key: 'targetRate', labelZh: '目标医院覆盖率', labelEn: 'Target Hospital Rate',
    max: 95, priority: 5,
    strategyZh: '加速目标医院准入谈判，建立双通道机制；部署PSM特种部队推动首发处方',
    strategyEn: 'Accelerate target hospital access negotiation; deploy PSM special forces for first Rx',
  },
];

export interface MarketIntelligence {
  totalDiagnosed: number;
  biologicPenetration: number;
  competitorShare: number;
  source: string;
  diseaseArea: string;
  dataYear: string;
  keyFindings: string[];
}

export interface SimulationAdjustment {
  indication: Indication;
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

export interface SimulationResult {
  year: number;
  currentRev: number;
  targetRev: number;
  achievedRev: number;
  achievedPct: number;
  gap: number;
  remaining: number;
  feasible: boolean;
  adjustments: SimulationAdjustment[];
  marketIntel: MarketIntelligence;
  overallStrategy: string;
}

// Simulated market intelligence search
// In production, this would call a real search API (e.g., Bing/Google/PubMed)
export function searchMarketData(year: number): MarketIntelligence {
  // Aggregate baseline diagnosed across indications for the year
  let totalDiag = 0;
  for (const ind of INDICATIONS) {
    totalDiag += getParamsForYear(ind, year).diagnosed;
  }

  // Simulated real-world data based on published epidemiology
  const yearFactor = Math.min(1, (year - 2025) * 0.02);
  const biologicPenetration = 15 + yearFactor * 30; // growing from ~15% to ~45%
  const competitorShare = 25 + yearFactor * 15;

  return {
    totalDiagnosed: totalDiag,
    biologicPenetration: Math.round(biologicPenetration * 10) / 10,
    competitorShare: Math.round(competitorShare * 10) / 10,
    source: '中国流行病学数据库 / CDE公开数据 / NRDL目录分析',
    diseaseArea: '系统性红斑狼疮 (SLE) 及相关B细胞介导免疫疾病',
    dataYear: `${year}`,
    keyFindings: [
      `中国SLE及相关疾病确诊总人数约 ${(totalDiag / 10000).toFixed(0)} 万人`,
      `当前生物制剂整体渗透率约 ${biologicPenetration.toFixed(0)}%，预计逐年提升`,
      `主要竞品（贝利尤单抗等）市占率约 ${competitorShare.toFixed(0)}%`,
      `医保覆盖后患者自付比例降至约30%，显著降低经济负担`,
      `城市三级医院覆盖率约65-70%，下沉市场仍有较大空间`,
    ],
  };
}

// Core reverse-calculation: given target revenue, find parameter adjustments
export function runSimulation(year: number, targetRevenue: number): SimulationResult {
  const currentRev = calculateTotalRevenue(year);
  const gap = targetRevenue - currentRev;
  const marketIntel = searchMarketData(year);

  // Build sensitivity map: for each (indication, lever), how much revenue per +1 point
  interface Move {
    ind: Indication;
    lever: LeverDef;
    sensPerPt: number;
    headroom: number;
    current: number;
  }

  const moves: Move[] = [];

  for (const ind of INDICATIONS) {
    const params = getParamsForYear(ind, year);
    const basePrice = getParamsForYear(ind, 2027).price;
    const actualPrice = year === 2027 ? basePrice : basePrice * (1 + (params.priceGrowth || 0) / 100);
    const baseResult = calculateFunnel(params, actualPrice);

    for (const lever of LEVERS) {
      const currentVal = params[lever.key] as number;
      const headroom = lever.max - currentVal;
      if (headroom <= 0) continue;

      const tweaked = { ...params, [lever.key]: currentVal + 1 };
      const tweakedResult = calculateFunnel(tweaked, actualPrice);
      const delta = tweakedResult.revenue - baseResult.revenue;

      if (delta > 0) {
        moves.push({ ind, lever, sensPerPt: delta, headroom, current: currentVal });
      }
    }
  }

  // Sort by sensitivity descending
  moves.sort((a, b) => b.sensPerPt - a.sensPerPt);

  // Greedy allocation
  let remaining = gap;
  const adjustments: SimulationAdjustment[] = [];

  for (const move of moves) {
    if (remaining <= 0) break;
    const ptsNeeded = Math.ceil(remaining / move.sensPerPt);
    const ptsUsed = Math.min(ptsNeeded, move.headroom);
    const revGained = ptsUsed * move.sensPerPt;

    adjustments.push({
      indication: move.ind,
      indicationLabel: INDICATION_LABELS[move.ind].zh,
      lever: move.lever.labelZh,
      leverKey: move.lever.key,
      from: move.current,
      to: move.current + ptsUsed,
      increase: ptsUsed,
      unit: '%',
      revGained,
      strategy: move.lever.strategyZh,
      priority: move.lever.priority,
    });

    remaining -= revGained;
  }

  const achievedRev = targetRevenue - Math.max(0, remaining);
  const achievedPct = currentRev > 0 ? ((achievedRev - currentRev) / currentRev) * 100 : 0;
  const feasible = remaining <= 0;

  // Generate overall strategy narrative
  const topLevers = Array.from(new Set(adjustments.slice(0, 3).map(a => a.lever)));
  const topIndications = Array.from(new Set(adjustments.slice(0, 3).map(a => a.indication)));
  const overallStrategy = generateStrategyNarrative(year, currentRev, targetRevenue, feasible, topLevers, topIndications, marketIntel);

  return {
    year,
    currentRev,
    targetRev: targetRevenue,
    achievedRev,
    achievedPct,
    gap,
    remaining: Math.max(0, remaining),
    feasible,
    adjustments,
    marketIntel,
    overallStrategy,
  };
}

function generateStrategyNarrative(
  year: number, currentRev: number, targetRev: number,
  feasible: boolean, topLevers: string[], topIndications: Indication[],
  intel: MarketIntelligence
): string {
  const growthPct = ((targetRev - currentRev) / currentRev * 100).toFixed(1);
  const gapM = ((targetRev - currentRev) / 1e6).toFixed(1);

  let narrative = `【${year}年增长路径分析】\n\n`;
  narrative += `目标：从 ¥${(currentRev / 1e6).toFixed(1)}M 增长至 ¥${(targetRev / 1e6).toFixed(1)}M（+${growthPct}%，增量 ¥${gapM}M）\n\n`;

  narrative += `【市场背景】\n`;
  narrative += `• ${intel.diseaseArea}确诊总人数约 ${(intel.totalDiagnosed / 1e4).toFixed(0)} 万\n`;
  narrative += `• 生物制剂渗透率 ${intel.biologicPenetration}%，竞品市占率 ${intel.competitorShare}%\n\n`;

  narrative += `【核心策略】\n`;
  if (topLevers.length > 0) {
    narrative += `优先调整杠杆：${topLevers.join('、')}\n`;
    narrative += `重点适应症：${topIndications.join('、')}\n\n`;
  }

  narrative += `【执行建议】\n`;
  narrative += `1. 短期（0-6个月）：聚焦核心医院首发处方，建立标杆案例\n`;
  narrative += `2. 中期（6-12个月）：扩大医院准入覆盖，推动下沉市场DTP\n`;
  narrative += `3. 长期（12个月+）：积累RWE数据，巩固学术地位，提升全适应症渗透\n\n`;

  if (!feasible) {
    narrative += `⚠️ 注意：在当前参数上限内无法完全达成目标。建议考虑：\n`;
    narrative += `• 调整定价策略或争取更优医保谈判条件\n`;
    narrative += `• 加速新适应症拓展\n`;
    narrative += `• 延长预测周期实现渐进增长\n`;
  } else {
    narrative += `✅ 目标可达成。按上述策略执行，预计可实现 +${growthPct}% 增长。\n`;
  }

  return narrative;
}
