'use client';

import type { BaselineYear } from '@/lib/types';

interface Props {
  yearlyData: Record<number, BaselineYear>;
  selectedYear: number;
  indColors: Record<string, string>;
  fmtMoney: (v: number) => string;
}

export default function RevenueChart({ yearlyData, selectedYear, indColors }: Props) {
  const years = Object.keys(yearlyData).map(Number).sort((a, b) => a - b);
  if (years.length === 0) return null;

  const cData = years.map(y => {
    const d = yearlyData[y];
    return {
      year: y,
      total: d.totalRevenue,
      LN: d.byIndication?.LN || 0,
      MN: d.byIndication?.MN || 0,
      ERL: d.byIndication?.ERL || 0,
      PNS: d.byIndication?.PNS || 0,
    };
  });

  const maxRev = Math.max(...cData.map(d => d.total)) * 1.2 || 1;
  const plotH = 180, baseY = 220;
  const yearCount = cData.length;
  const chartW = 1000;
  const barW = Math.max(12, Math.min(40, (chartW / yearCount) * 0.4));
  const halfBar = barW / 2;
  const getX = (i: number) => (chartW / yearCount) * (i + 0.5);
  const fontSize = yearCount <= 10 ? 12 : yearCount <= 15 ? 11 : 10;
  const valFontSize = yearCount <= 10 ? 11 : yearCount <= 15 ? 10 : 9;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            终端销售额预估趋势
          </h2>
          <div className="flex items-center gap-4 mt-2 text-[10px] font-bold flex-wrap">
            {Object.entries(indColors).map(([k, c]) => (
              <div key={k} className="flex items-center gap-1 text-slate-500">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} /> {k}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="relative h-[280px] w-full overflow-hidden">
        <svg viewBox={`0 0 ${chartW} 260`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
          {/* Grid */}
          {[50, 100, 150, 200].map(gy => (
            <line key={gy} x1="0" y1={gy} x2={chartW} y2={gy} stroke="#f1f5f9" strokeWidth="1" />
          ))}
          <line x1="0" y1={baseY} x2={chartW} y2={baseY} stroke="#cbd5e1" strokeWidth="2" />
          {/* Year labels */}
          {cData.map((d, i) => (
            <text key={d.year} x={getX(i)} y={240} fontSize={fontSize}
              fill={d.year === selectedYear ? '#2563eb' : '#64748b'}
              fontWeight={d.year === selectedYear ? 'bold' : 'normal'}
              textAnchor="middle">{d.year}</text>
          ))}
          {/* Stacked bars */}
          {cData.map((d, i) => {
            const x = getX(i);
            const hLN = (d.LN / maxRev) * plotH;
            const hMN = (d.MN / maxRev) * plotH;
            const hERL = (d.ERL / maxRev) * plotH;
            const hPNS = (d.PNS / maxRev) * plotH;
            let cy = baseY;
            const yLN = cy - hLN; cy = yLN;
            const yMN = cy - hMN; cy = yMN;
            const yERL = cy - hERL; cy = yERL;
            const yPNS = cy - hPNS;
            return (
              <g key={d.year}>
                <rect x={x - halfBar} y={yLN} width={barW} height={hLN} fill={indColors.LN} rx="1" opacity={d.year === selectedYear ? 1 : 0.8} />
                <rect x={x - halfBar} y={yMN} width={barW} height={hMN} fill={indColors.MN} rx="1" opacity={d.year === selectedYear ? 1 : 0.8} />
                <rect x={x - halfBar} y={yERL} width={barW} height={hERL} fill={indColors.ERL} rx="1" opacity={d.year === selectedYear ? 1 : 0.8} />
                <rect x={x - halfBar} y={yPNS} width={barW} height={hPNS} fill={indColors.PNS} rx="1" opacity={d.year === selectedYear ? 1 : 0.8} />
                <text x={x} y={yPNS - 6} fontSize={valFontSize} fontWeight="bold" fill="#475569" textAnchor="middle">
                  {(d.total / 1e6).toFixed(1)}M
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
