'use client';

import type { SimResult } from '@/lib/types';

interface Props {
  result: SimResult;
  fmtMoney: (v: number) => string;
  indColors: Record<string, string>;
}

const IND_BG: Record<string, string> = {
  LN: 'bg-blue-600', MN: 'bg-indigo-500', ERL: 'bg-sky-500', PNS: 'bg-teal-400',
};

export default function SimResultPanel({ result, fmtMoney }: Props) {
  return (
    <div className="space-y-6 animate-fade-in">
      <SummaryCards result={result} fmtMoney={fmtMoney} />
      <MarketIntelCard result={result} />
      <AdjustmentsTable result={result} fmtMoney={fmtMoney} />
      <StrategyNarrative result={result} fmtMoney={fmtMoney} />
    </div>
  );
}

function SummaryCards({ result, fmtMoney }: { result: SimResult; fmtMoney: (v: number) => string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className={`p-5 rounded-2xl border shadow-sm ${result.feasible ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="text-xs font-bold text-slate-500 mb-1">模拟结果</div>
        <div className={`text-2xl font-black ${result.feasible ? 'text-emerald-700' : 'text-amber-700'}`}>
          {result.feasible ? '✅ 可达成' : '⚠️ 部分可达成'}
        </div>
        {!result.feasible && <div className="text-xs text-amber-600 mt-1">缺口: {fmtMoney(result.remaining)}</div>}
      </div>
      <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 shadow-sm">
        <div className="text-xs font-bold text-slate-500 mb-1">可实现营收</div>
        <div className="text-2xl font-black text-blue-700">{fmtMoney(result.achievedRev)}</div>
        <div className="text-xs text-blue-500 mt-1">+{result.achievedPct.toFixed(1)}% vs 当前</div>
      </div>
      <div className="bg-purple-50 p-5 rounded-2xl border border-purple-200 shadow-sm">
        <div className="text-xs font-bold text-slate-500 mb-1">需调整参数数</div>
        <div className="text-2xl font-black text-purple-700">{result.adjustments.length}</div>
        <div className="text-xs text-purple-500 mt-1">跨适应症杠杆</div>
      </div>
    </div>
  );
}

function MarketIntelCard({ result }: { result: SimResult }) {
  const intel = result.marketIntel;
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        市场情报检索结果
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
          <div className="text-xs font-bold text-indigo-500 mb-1">确诊总人数</div>
          <div className="text-xl font-black text-indigo-700">{(intel.totalDiagnosed / 1e4).toFixed(0)} 万</div>
        </div>
        <div className="bg-sky-50 p-4 rounded-xl border border-sky-100">
          <div className="text-xs font-bold text-sky-500 mb-1">生物制剂渗透率</div>
          <div className="text-xl font-black text-sky-700">{intel.biologicPenetration}%</div>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
          <div className="text-xs font-bold text-amber-500 mb-1">竞品市占率</div>
          <div className="text-xl font-black text-amber-700">{intel.competitorShare}%</div>
        </div>
      </div>
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="text-xs font-bold text-slate-500 mb-2">数据来源: {intel.source}</div>
        <ul className="text-sm text-slate-600 space-y-1">
          {intel.keyFindings.map((f, i) => <li key={i} className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">•</span>{f}</li>)}
        </ul>
      </div>
    </div>
  );
}

function AdjustmentsTable({ result, fmtMoney }: { result: SimResult; fmtMoney: (v: number) => string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
        策略建议与参数调整方案
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs">
              <th className="p-3 font-bold">#</th>
              <th className="p-3 font-bold">适应症</th>
              <th className="p-3 font-bold">调整杠杆</th>
              <th className="p-3 font-bold text-center">当前值</th>
              <th className="p-3 font-bold text-center">→</th>
              <th className="p-3 font-bold text-center">目标值</th>
              <th className="p-3 font-bold text-center">增幅</th>
              <th className="p-3 font-bold text-right">贡献营收</th>
            </tr>
          </thead>
          <tbody>
            {result.adjustments.map((s, idx) => (
              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-3 text-xs text-slate-400 font-mono">{idx + 1}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${IND_BG[s.indication] || 'bg-slate-500'}`}>{s.indication}</span>
                </td>
                <td className="p-3 font-bold text-slate-700">{s.lever}</td>
                <td className="p-3 text-center font-mono text-slate-500">{s.from}{s.unit}</td>
                <td className="p-3 text-center text-slate-300">→</td>
                <td className="p-3 text-center font-mono font-bold text-blue-600">{s.to}{s.unit}</td>
                <td className="p-3 text-center font-bold text-emerald-600">+{s.increase}{s.unit}</td>
                <td className="p-3 text-right font-mono font-bold text-slate-700">{fmtMoney(s.revGained)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t-2 border-slate-300">
              <td colSpan={7} className="p-3 font-bold text-slate-700 text-right">合计增量营收</td>
              <td className="p-3 text-right font-mono font-black text-emerald-600">{fmtMoney(result.achievedRev - result.currentRev)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function StrategyNarrative({ result, fmtMoney }: { result: SimResult; fmtMoney: (v: number) => string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        AI 生成策略叙述
      </h2>
      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-mono">
        {result.overallStrategy}
      </div>

      {/* Per-adjustment strategy cards */}
      <div className="mt-6 space-y-3">
        {result.adjustments.slice(0, 5).map((s, idx) => (
          <div key={idx} className="flex gap-4 items-start p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${IND_BG[s.indication] || 'bg-slate-500'}`}>
              {idx + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-bold text-slate-800">{s.indication} — {s.lever}</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{s.from}→{s.to}{s.unit}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{fmtMoney(s.revGained)}</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{s.strategy}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Feasibility note */}
      {result.feasible ? (
        <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <span className="text-emerald-500 text-xl">✅</span>
          <div>
            <div className="font-bold text-emerald-800 mb-1">目标可达成</div>
            <p className="text-sm text-emerald-700">按上述策略调整参数后，可实现目标增长。</p>
          </div>
        </div>
      ) : (
        <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <span className="text-amber-500 text-xl">⚠️</span>
          <div>
            <div className="font-bold text-amber-800 mb-1">目标增长率在当前参数上限内无法完全达成</div>
            <p className="text-sm text-amber-700">建议考虑：1) 调整定价策略 2) 拓展新适应症 3) 延长预测周期以实现渐进增长</p>
          </div>
        </div>
      )}
    </div>
  );
}
