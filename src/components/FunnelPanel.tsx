'use client';

import { useState, useEffect } from 'react';

interface IndDetail {
  params: {
    diagnosed: number;
    urbanRate: number;
    targetRate: number;
    treatedRate: number;
    bxAdoption: number;
    gazyvaShare: number;
    injectionInit: number;
    injectionMaint: number;
    compliance: number;
    price: number;
  };
  result: {
    urbanDiag: number;
    target: number;
    treated: number;
    bxPatients: number;
    gazyvaPatients: number;
    actualVials: number;
    revenue: number;
    exFactoryRevenue: number;
  };
}

interface Props {
  selectedYear: number;
  fmtMoney: (v: number) => string;
  indColors: Record<string, string>;
}

export default function FunnelPanel({ selectedYear, fmtMoney, indColors }: Props) {
  const [data, setData] = useState<Record<string, IndDetail> | null>(null);
  const [activeInd, setActiveInd] = useState('LN');

  useEffect(() => {
    fetch(`/api/baseline?year=${selectedYear}`)
      .then(r => r.json())
      .then(d => setData(d.indications || null))
      .catch(() => setData(null));
  }, [selectedYear]);

  if (!data) return null;

  const ind = data[activeInd];
  if (!ind) return null;

  const steps = [
    { label: '确诊人数', value: ind.params.diagnosed, fmt: (v: number) => `${(v / 1e4).toFixed(1)} 万` },
    { label: '城市覆盖', value: ind.result.urbanDiag, fmt: (v: number) => `${(v / 1e4).toFixed(1)} 万`, pct: `${ind.params.urbanRate}%` },
    { label: '目标医院', value: ind.result.target, fmt: (v: number) => `${(v / 1e4).toFixed(1)} 万`, pct: `${ind.params.targetRate}%` },
    { label: '生物制剂', value: ind.result.bxPatients, fmt: (v: number) => `${(v / 1e4).toFixed(1)} 万`, pct: `${ind.params.bxAdoption}%` },
    { label: 'Gazyva', value: ind.result.gazyvaPatients, fmt: (v: number) => `${Math.round(v).toLocaleString()}`, pct: `${ind.params.gazyvaShare}%` },
  ];

  const maxVal = steps[0].value || 1;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          {selectedYear} 年漏斗测算
        </h2>
        <div className="flex gap-2">
          {['LN', 'MN', 'ERL', 'PNS'].map(k => (
            <button key={k} onClick={() => setActiveInd(k)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${activeInd === k ? 'text-white shadow-sm' : 'text-slate-500 bg-slate-100 hover:bg-slate-200'}`}
              style={activeInd === k ? { backgroundColor: indColors[k] } : {}}>
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {steps.map((step, i) => {
            const widthPct = Math.max(15, (step.value / maxVal) * 100);
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-20 text-xs font-bold text-slate-600 text-right">{step.label}</div>
                <div className="flex-1 relative">
                  <div className="h-8 rounded-lg transition-all duration-500"
                    style={{ width: `${widthPct}%`, backgroundColor: indColors[activeInd], opacity: 1 - i * 0.15 }}>
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-white text-xs font-bold drop-shadow">{step.fmt(step.value)}</span>
                      {step.pct && <span className="ml-auto text-white/80 text-[10px] font-bold">{step.pct}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-500 mb-1">Gazyva 患者数</div>
            <div className="text-xl font-black text-slate-800">{Math.round(ind.result.gazyvaPatients).toLocaleString()}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-500 mb-1">实际用药支数</div>
            <div className="text-xl font-black text-slate-800">{Math.round(ind.result.actualVials).toLocaleString()}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <div className="text-xs font-bold text-blue-500 mb-1">终端营收</div>
            <div className="text-xl font-black text-blue-700">{fmtMoney(ind.result.revenue)}</div>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
            <div className="text-xs font-bold text-emerald-500 mb-1">出厂营收</div>
            <div className="text-xl font-black text-emerald-700">{fmtMoney(ind.result.exFactoryRevenue)}</div>
          </div>
          <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-500 mb-2">关键参数</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div><span className="text-slate-400">依从性:</span> <span className="font-bold">{ind.params.compliance}%</span></div>
              <div><span className="text-slate-400">注射次数:</span> <span className="font-bold">{ind.params.injectionInit}+{ind.params.injectionMaint}</span></div>
              <div><span className="text-slate-400">单价:</span> <span className="font-bold">¥{ind.params.price.toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
