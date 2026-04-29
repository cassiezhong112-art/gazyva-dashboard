import {
  type Indication, type FunnelParams,
  INDICATIONS, INDICATION_LABELS,
  getParamsForYear, calculateFunnel, calculateTotalRevenue,
} from './funnel-data';

// ============================================================
// Mock AI Engine — parses user commands and generates suggestions
// Replace with real Gemini API call when key is available
// ============================================================

export interface AiSuggestion {
  type: 'funnel' | 'opex' | 'both';
  year: number;
  funnelChanges?: Record<string, Partial<FunnelParams>>;
  opexChanges?: {
    masterFtePct?: number;
    callsPerDay?: number;
    daysInField?: number;
  };
  explanation: string;
  marketData?: {
    source: string;
    findings: string[];
  };
  confirmPrompt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestion?: AiSuggestion;
}

// Simulated market data search
function searchMarketMetrics(indication: string, year: number) {
  const data: Record<string, { diagnosed: number; penetration: number; competitor: number; growth: string }> = {
    LN: { diagnosed: 517000, penetration: 18, competitor: 25, growth: '年增长约3-5%' },
    MN: { diagnosed: 510000, penetration: 22, competitor: 30, growth: '年增长约5-8%' },
    ERL: { diagnosed: 516000, penetration: 12, competitor: 20, growth: '年增长约2-4%' },
    PNS: { diagnosed: 116000, penetration: 8, competitor: 15, growth: '年增长约3-6%' },
  };
  const d = data[indication] || data.LN;
  const yearAdj = Math.min(1, (year - 2027) * 0.03);
  return {
    diagnosed: Math.round(d.diagnosed * (1 + yearAdj * 0.5)),
    penetration: Math.round((d.penetration + yearAdj * 20) * 10) / 10,
    competitor: Math.round((d.competitor + yearAdj * 10) * 10) / 10,
    growth: d.growth,
  };
}

// Parse user intent from natural language
function parseIntent(message: string): {
  action: 'simulate_funnel' | 'set_opex' | 'target_revenue' | 'help' | 'unknown';
  year?: number;
  indication?: Indication;
  targetRev?: number;
  params?: Partial<FunnelParams>;
  opexParams?: { masterFtePct?: number; callsPerDay?: number; daysInField?: number };
} {
  const msg = message.toLowerCase();

  // Extract year
  const yearMatch = msg.match(/20[2-4]\d/);
  const year = yearMatch ? parseInt(yearMatch[0]) : undefined;

  // Extract indication
  let indication: Indication | undefined;
  if (msg.includes('ln') || msg.includes('狼疮性肾炎') || msg.includes('lupus nephritis')) indication = 'LN';
  else if (msg.includes('mn') || msg.includes('膜性肾病') || msg.includes('membranous')) indication = 'MN';
  else if (msg.includes('erl') || msg.includes('难治性狼疮') || msg.includes('extra-renal')) indication = 'ERL';
  else if (msg.includes('pns') || msg.includes('肾病综合征') || msg.includes('nephrotic')) indication = 'PNS';

  // Extract target revenue
  const revMatch = msg.match(/(\d+\.?\d*)\s*(m|百万|million|亿)/i);
  let targetRev: number | undefined;
  if (revMatch) {
    targetRev = parseFloat(revMatch[1]);
    if (revMatch[2] === '亿') targetRev *= 100;
    targetRev *= 1e6;
  }

  // Detect intent
  if (msg.includes('帮助') || msg.includes('help') || msg.includes('你能做什么') || msg.includes('what can you do')) {
    return { action: 'help' };
  }
  if (msg.includes('opex') || msg.includes('成本') || msg.includes('预算') || msg.includes('fte') || msg.includes('人员')) {
    const pctMatch = msg.match(/(\d+\.?\d*)\s*%/);
    return {
      action: 'set_opex',
      year,
      opexParams: {
        masterFtePct: pctMatch ? parseFloat(pctMatch[1]) : undefined,
      }
    };
  }
  if (targetRev || msg.includes('目标') || msg.includes('target') || msg.includes('达成') || msg.includes('营收')) {
    return { action: 'target_revenue', year, indication, targetRev };
  }
  if (msg.includes('模拟') || msg.includes('simulate') || msg.includes('漏斗') || msg.includes('funnel') || msg.includes('填写') || msg.includes('设置') || msg.includes('预测')) {
    return { action: 'simulate_funnel', year, indication };
  }

  return { action: 'unknown' };
}

// Main AI response generator
export function generateAiResponse(message: string, currentYear: number): ChatMessage {
  const intent = parseIntent(message);
  const year = intent.year || currentYear;

  switch (intent.action) {
    case 'help': {
      return {
        role: 'assistant',
        content: `我可以帮你完成以下操作：

**🔬 模拟 Patient Funnel**
- "帮我模拟2028年LN的漏斗"
- "预测2029年所有适应症的patient funnel"

**🎯 目标营收反推**
- "2028年目标营收500M，帮我反推参数"
- "LN 2029年要达到200M需要什么参数"

**💰 OPEX 预算设置**
- "设置Non-FTE预算占比为2%"
- "帮我优化2028年的成本预算"

**📊 市场数据查询**
- "查一下LN的市场数据"
- "2029年MN的竞品情况"

输入指令后，我会给出建议参数，你确认后可以一键填入看板。`,
      };
    }

    case 'simulate_funnel': {
      const indList = intent.indication ? [intent.indication] : INDICATIONS;
      const changes: Record<string, Partial<FunnelParams>> = {};
      const findings: string[] = [];

      for (const ind of indList) {
        const market = searchMarketMetrics(ind, year);
        const base = getParamsForYear(ind, year);
        const yearDelta = year - 2027;

        // Generate optimized parameters based on market data
        const suggested: Partial<FunnelParams> = {
          diagnosed: market.diagnosed,
          urbanRate: Math.min(85, base.urbanRate + yearDelta * 1.5),
          bxAdoption: Math.min(75, base.bxAdoption + yearDelta * 4),
          gazyvaShare: Math.min(65, base.gazyvaShare + yearDelta * 5),
          compliance: Math.min(85, base.compliance + yearDelta * 3),
        };

        changes[ind] = suggested;
        findings.push(
          `${ind}(${INDICATION_LABELS[ind].zh}): 确诊${(market.diagnosed/1e4).toFixed(0)}万, 生物制剂渗透${market.penetration}%, 竞品市占${market.competitor}%`
        );
      }

      // Calculate projected revenue
      let projectedRev = 0;
      for (const ind of INDICATIONS) {
        const params = { ...getParamsForYear(ind, year), ...(changes[ind] || {}) };
        projectedRev += calculateFunnel(params, params.price).revenue;
      }

      const indLabel = intent.indication
        ? `${intent.indication}(${INDICATION_LABELS[intent.indication].zh})`
        : '所有适应症';

      return {
        role: 'assistant',
        content: `📊 **${year}年 ${indLabel} Patient Funnel 模拟结果**

**市场数据检索：**
${findings.map(f => `• ${f}`).join('\n')}

**建议参数调整：**
${Object.entries(changes).map(([ind, c]) => {
  const base = getParamsForYear(ind as Indication, year);
  const lines: string[] = [];
  if (c.urbanRate && c.urbanRate !== base.urbanRate) lines.push(`城市覆盖率: ${base.urbanRate}% → ${Math.round(c.urbanRate as number)}%`);
  if (c.bxAdoption && c.bxAdoption !== base.bxAdoption) lines.push(`生物制剂采纳率: ${base.bxAdoption}% → ${Math.round(c.bxAdoption as number)}%`);
  if (c.gazyvaShare && c.gazyvaShare !== base.gazyvaShare) lines.push(`Gazyva市占率: ${base.gazyvaShare}% → ${Math.round(c.gazyvaShare as number)}%`);
  if (c.compliance && c.compliance !== base.compliance) lines.push(`依从性: ${base.compliance}% → ${Math.round(c.compliance as number)}%`);
  return `**${ind}:** ${lines.join(' | ')}`;
}).join('\n')}

**预计总营收：¥${(projectedRev / 1e6).toFixed(1)}M**

点击下方按钮将参数填入看板 👇`,
        suggestion: {
          type: 'funnel',
          year,
          funnelChanges: changes,
          explanation: `基于${year}年市场数据模拟，优化${indLabel}的漏斗参数`,
          marketData: {
            source: '中国流行病学数据库 / CDE公开数据 / NRDL目录分析',
            findings,
          },
          confirmPrompt: `确认将以上参数填入${year}年的Patient Funnel？`,
        },
      };
    }

    case 'target_revenue': {
      const targetRev = intent.targetRev || calculateTotalRevenue(year) * 1.2;
      const currentRev = calculateTotalRevenue(year);
      const indList = intent.indication ? [intent.indication] : INDICATIONS;
      const gap = targetRev - currentRev;

      // Reverse-engineer parameters to hit target
      const changes: Record<string, Partial<FunnelParams>> = {};
      let remaining = gap;

      // Sensitivity-based allocation
      interface Move { ind: Indication; key: keyof FunnelParams; sens: number; headroom: number; current: number }
      const moves: Move[] = [];
      const caps: Record<string, number> = { gazyvaShare: 80, bxAdoption: 90, compliance: 95, urbanRate: 90, targetRate: 95 };

      for (const ind of indList) {
        const params = getParamsForYear(ind, year);
        const baseResult = calculateFunnel(params, params.price);
        for (const key of ['gazyvaShare', 'bxAdoption', 'compliance', 'urbanRate', 'targetRate'] as (keyof FunnelParams)[]) {
          const val = params[key] as number;
          const cap = caps[key] || 100;
          const headroom = cap - val;
          if (headroom <= 0) continue;
          const tweaked = { ...params, [key]: val + 1 };
          const delta = calculateFunnel(tweaked, params.price).revenue - baseResult.revenue;
          if (delta > 0) moves.push({ ind, key, sens: delta, headroom, current: val });
        }
      }
      moves.sort((a, b) => b.sens - a.sens);

      for (const m of moves) {
        if (remaining <= 0) break;
        const pts = Math.min(Math.ceil(remaining / m.sens), m.headroom);
        if (!changes[m.ind]) changes[m.ind] = {};
        (changes[m.ind] as Record<string, number>)[m.key] = m.current + pts;
        remaining -= pts * m.sens;
      }

      const achievedRev = targetRev - Math.max(0, remaining);
      const feasible = remaining <= 0;
      const indLabel = intent.indication ? intent.indication : '全适应症';

      return {
        role: 'assistant',
        content: `🎯 **${year}年 ${indLabel} 目标营收反推**

**当前营收：** ¥${(currentRev / 1e6).toFixed(1)}M
**目标营收：** ¥${(targetRev / 1e6).toFixed(1)}M（${gap > 0 ? '+' : ''}${(gap / 1e6).toFixed(1)}M）
**可达成：** ¥${(achievedRev / 1e6).toFixed(1)}M ${feasible ? '✅' : '⚠️ 部分可达成'}

**需要调整的参数：**
${Object.entries(changes).map(([ind, c]) => {
  const base = getParamsForYear(ind as Indication, year);
  const items = Object.entries(c).map(([k, v]) => {
    const labels: Record<string, string> = { gazyvaShare: 'Gazyva市占率', bxAdoption: '生物制剂采纳率', compliance: '依从性', urbanRate: '城市覆盖率', targetRate: '目标医院覆盖率' };
    return `${labels[k] || k}: ${(base as unknown as Record<string, number>)[k]}% → ${Math.round(v as number)}%`;
  });
  return `**${ind}:** ${items.join(' | ')}`;
}).join('\n')}

${!feasible ? `\n⚠️ 缺口 ¥${(Math.max(0, remaining) / 1e6).toFixed(1)}M，建议考虑调整定价或拓展新适应症。` : ''}

点击下方按钮将参数填入看板 👇`,
        suggestion: {
          type: 'funnel',
          year,
          funnelChanges: changes,
          explanation: `反推${year}年达成¥${(targetRev / 1e6).toFixed(0)}M目标所需参数`,
          confirmPrompt: `确认将反推参数填入${year}年的Patient Funnel？`,
        },
      };
    }

    case 'set_opex': {
      const pct = intent.opexParams?.masterFtePct || 1.5;
      return {
        role: 'assistant',
        content: `💰 **OPEX 预算调整建议**

**Non-FTE 预算占比：** ${pct}%
**基于${year}年营收 ¥${(calculateTotalRevenue(year) / 1e6).toFixed(1)}M**
**Non-FTE 预算：** ¥${(calculateTotalRevenue(year) * pct / 100 / 1e6).toFixed(1)}M

点击下方按钮应用设置 👇`,
        suggestion: {
          type: 'opex',
          year,
          opexChanges: { masterFtePct: pct },
          explanation: `设置${year}年Non-FTE预算占比为${pct}%`,
          confirmPrompt: `确认将Non-FTE预算占比设为${pct}%？`,
        },
      };
    }

    default: {
      return {
        role: 'assistant',
        content: `我不太理解你的指令。你可以试试：

• **"帮我模拟2028年LN的漏斗"**
• **"2029年目标营收500M，帮我反推"**
• **"设置Non-FTE预算占比为2%"**
• **"帮助"** — 查看所有可用指令`,
      };
    }
  }
}
