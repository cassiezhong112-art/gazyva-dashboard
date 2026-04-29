import { NextRequest, NextResponse } from 'next/server';
import {
  INDICATIONS, getParamsForYear, calculateFunnel, calculateTotalRevenue,
} from '@/lib/funnel-data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const yearStr = searchParams.get('year');
  const startStr = searchParams.get('start');
  const endStr = searchParams.get('end');

  // Single year mode
  if (yearStr) {
    const year = parseInt(yearStr);
    if (year < 2027 || year > 2046) {
      return NextResponse.json({ error: '年份范围: 2027-2046' }, { status: 400 });
    }

    const indResults: Record<string, { params: ReturnType<typeof getParamsForYear>; result: ReturnType<typeof calculateFunnel> }> = {};
    for (const ind of INDICATIONS) {
      const params = getParamsForYear(ind, year);
      const basePrice = getParamsForYear(ind, 2027).price;
      const actualPrice = year === 2027 ? basePrice : basePrice * (1 + (params.priceGrowth || 0) / 100);
      indResults[ind] = { params, result: calculateFunnel(params, actualPrice) };
    }

    return NextResponse.json({
      year,
      totalRevenue: calculateTotalRevenue(year),
      indications: indResults,
    });
  }

  // Range mode
  const start = parseInt(startStr || '2027');
  const end = parseInt(endStr || '2036');
  const years: Record<number, { totalRevenue: number; byIndication: Record<string, number> }> = {};

  for (let y = start; y <= end; y++) {
    const byInd: Record<string, number> = {};
    for (const ind of INDICATIONS) {
      const params = getParamsForYear(ind, y);
      const basePrice = getParamsForYear(ind, 2027).price;
      const actualPrice = y === 2027 ? basePrice : basePrice * (1 + (params.priceGrowth || 0) / 100);
      byInd[ind] = calculateFunnel(params, actualPrice).revenue;
    }
    years[y] = { totalRevenue: calculateTotalRevenue(y), byIndication: byInd };
  }

  return NextResponse.json({ years });
}
