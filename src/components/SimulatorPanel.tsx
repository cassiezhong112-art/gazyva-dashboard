'use client';

import { useState } from 'react';

interface Props {
  selectedYear: number;
  currentRev: number;
  onSimulate: (year: number, targetRev: number) => void;
  loading: boolean;
  fmtMoney: (v: number) => string;
}

export default function SimulatorPanel({ selectedYear, currentRev, onSimulate, loading, fmtMoney }: Props) {
  const [targetRevM, setTargetRevM] = useState('');
  const [growthPct, setGrowthPct] = useState(20);
  const [mode, setMode] = useState<'pct' | 'abs'>('pct');

  const computedTarget = mode === 'pct'
    ? currentRev * (1 + growthPct / 100)
    : (parseFloat(targetRevM) || 0) * 1e6;

  const handleRun = () => {
    if (computedTarget > 0) {
      onSimulate(selectedYear, computedTarget);
    }
  };

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl shadow-sm border border-emerald-200">
      <h2 className="text-xl font-bold mb-5 flex items-center gap-2 text-emerald-800">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        AI 增长模拟器 — 输入目标，自动反推策略
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        {/* Current Revenue */}
        <div className="bg-white/80 p-4 rounded-xl border border-emerald-100">
          <div className="text-xs font-bold text-slate-500 mb-1">{selectedYear} 年当前营收</div>
          <div className="text-xl font-black text-slate-800">{fmtMoney(currentRev)}</div>
        </div>

        {/* Mode Toggle */}
        <div className="bg-white/80 p-4 rounded-xl border border-emerald-100">
          <div className="text-xs font-bold text-slate-500 mb-2">输入方式</div>
          <div className="flex bg-emerald-100 p-1 rounded-lg">
            <button onClick={() => setMode('pct')}
              className={`flex-1 px-3 py-1.5 rounded text-xs font-bold transition-colors ${mode === 'pct' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}>
              增长率 %
            </button>
            <button onClick={() => setMode('abs')}
              className={`flex-1 px-3 py-1.5 rounded text-xs font-bold transition-colors ${mode === 'abs' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}>
              目标金额
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="bg-white/80 p-4 rounded-xl border border-emerald-200">
          {mode === 'pct' ? (
            <>
              <div className="text-xs font-bold text-emerald-600 mb-2">目标增长率</div>
              <div className="flex items-center gap-2">
                <input type="number" min={-50} max={500} value={growthPct}
                  onChange={e => setGrowthPct(Number(e.target.value) || 0)}
                  className="w-20 bg-white border border-emerald-300 rounded-lg px-3 py-2 text-xl font-black text-emerald-700 text-center focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                <span className="text-lg font-bold text-emerald-600">%</span>
              </div>
            </>
          ) : (
            <>
              <div className="text-xs font-bold text-emerald-600 mb-2">Target Revenue (¥ M)</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-500">¥</span>
                <input type="number" min={0} step={0.1} value={targetRevM}
                  onChange={e => setTargetRevM(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-24 bg-white border border-emerald-300 rounded-lg px-3 py-2 text-xl font-black text-emerald-700 text-center focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                <span className="text-sm font-bold text-slate-500">M</span>
              </div>
            </>
          )}
          <div className="text-xs text-emerald-500 mt-2">
            目标营收: <span className="font-bold">{fmtMoney(computedTarget)}</span>
          </div>
        </div>

        {/* Gap Preview */}
        <div className="bg-white/80 p-4 rounded-xl border border-emerald-100">
          <div className="text-xs font-bold text-slate-500 mb-1">需增量</div>
          <div className={`text-xl font-black ${computedTarget >= currentRev ? 'text-emerald-600' : 'text-red-500'}`}>
            {computedTarget >= currentRev ? '+' : ''}{fmtMoney(computedTarget - currentRev)}
          </div>
        </div>

        {/* Run Button */}
        <div>
          <button onClick={handleRun} disabled={loading || computedTarget <= 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3.5 px-6 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm pulse-glow">
            {loading ? (
              <span className="animate-pulse">运行中...</span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                运行模拟
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
