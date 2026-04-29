'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SimResult, BaselineYear } from '@/lib/types';
import RevenueChart from './RevenueChart';
import SimulatorPanel from './SimulatorPanel';
import SimResultPanel from './SimResultPanel';
import FunnelPanel from './FunnelPanel';

const IND_COLORS: Record<string, string> = {
  LN: '#2563eb', MN: '#6366f1', ERL: '#0ea5e9', PNS: '#2dd4bf',
};

function fmtMoney(val: number): string {
  return `¥ ${(val / 1e6).toFixed(2)} M`;
}

export default function Dashboard() {
  const [startYear, setStartYear] = useState(2027);
  const [endYear, setEndYear] = useState(2036);
  const [selectedYear, setSelectedYear] = useState(2027);
  const [yearlyData, setYearlyData] = useState<Record<number, BaselineYear>>({});
  const [loading, setLoading] = useState(true);
  const [simResult, setSimResult] = useState<SimResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const fetchBaseline = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/baseline?start=${startYear}&end=${endYear}`);
      const data = await res.json();
      setYearlyData(data.years || {});
    } catch (e) {
      console.error('Failed to fetch baseline:', e);
    }
    setLoading(false);
  }, [startYear, endYear]);

  useEffect(() => { fetchBaseline(); }, [fetchBaseline]);

  const handleSimulate = async (year: number, targetRev: number) => {
    setSimLoading(true);
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, targetRevenue: targetRev }),
      });
      const data: SimResult = await res.json();
      setSimResult(data);
    } catch (e) {
      console.error('Simulation failed:', e);
    }
    setSimLoading(false);
  };

  const currentRev = yearlyData[selectedYear]?.totalRevenue || 0;
  const years = Object.keys(yearlyData).map(Number).sort((a, b) => a - b);

  return (
    <div className="min-h-screen font-sans text-slate-900 pb-12 bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center min-h-[4rem] py-3 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
                </svg>
              </div>
              <span className="font-black text-2xl text-slate-800 tracking-tight">
                GAZYVA <span className="font-bold text-slate-500 text-base ml-2">佳罗华全景财务与部署看板</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <span>全局范围:</span>
                <input type="number" min={2027} max={endYear} value={startYear}
                  onChange={e => { const v = Math.max(2027, Math.min(Number(e.target.value), endYear)); setStartYear(v); if (selectedYear < v) setSelectedYear(v); }}
                  className="w-14 bg-slate-50 border border-slate-200 rounded px-1 text-xs text-center font-mono focus:outline-none" />
                <span className="text-slate-400">-</span>
                <input type="number" min={startYear} max={2046} value={endYear}
                  onChange={e => { const v = Math.max(startYear, Math.min(Number(e.target.value), 2046)); setEndYear(v); if (selectedYear > v) setSelectedYear(v); }}
                  className="w-14 bg-slate-50 border border-slate-200 rounded px-1 text-xs text-center font-mono focus:outline-none" />
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <span>当前年份:</span>
                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 text-sm font-bold text-blue-600 rounded-lg px-3 py-1 focus:outline-none cursor-pointer">
                  {years.map(y => <option key={y} value={y}>{y} 年</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-400 text-lg font-bold animate-pulse">加载数据中...</div>
          </div>
        ) : (
          <>
            {/* Revenue Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-600 p-5 rounded-2xl shadow-sm text-white flex flex-col justify-center items-center text-center relative overflow-hidden">
                <div className="text-sm font-bold uppercase tracking-wider mb-1 opacity-80">2030 年峰值目标</div>
                <div className="text-3xl font-black">{fmtMoney(yearlyData[2030]?.totalRevenue || 0)}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="text-xs font-bold text-slate-500 mb-1">{selectedYear} 年终端营收</div>
                <div className="text-2xl font-black text-slate-800">{fmtMoney(currentRev)}</div>
              </div>
              {['LN', 'MN', 'ERL'].map(ind => (
                <div key={ind} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 mb-1">{ind} {selectedYear}</div>
                  <div className="text-xl font-black" style={{ color: IND_COLORS[ind] }}>
                    {fmtMoney(yearlyData[selectedYear]?.byIndication?.[ind] || 0)}
                  </div>
                </div>
              ))}
            </div>

            {/* Revenue Chart */}
            <RevenueChart yearlyData={yearlyData} selectedYear={selectedYear} indColors={IND_COLORS} fmtMoney={fmtMoney} />

            {/* AI Growth Simulator */}
            <SimulatorPanel
              selectedYear={selectedYear}
              currentRev={currentRev}
              onSimulate={handleSimulate}
              loading={simLoading}
              fmtMoney={fmtMoney}
            />

            {/* Simulation Results */}
            {simResult && simResult.year === selectedYear && (
              <SimResultPanel result={simResult} fmtMoney={fmtMoney} indColors={IND_COLORS} />
            )}

            {/* Funnel Overview */}
            <FunnelPanel selectedYear={selectedYear} fmtMoney={fmtMoney} indColors={IND_COLORS} />
          </>
        )}
      </div>
    </div>
  );
}
