import { NextRequest, NextResponse } from 'next/server';
import { runSimulation } from '@/lib/simulate-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, targetRevenue } = body;

    if (!year || !targetRevenue) {
      return NextResponse.json(
        { error: '缺少必要参数: year, targetRevenue' },
        { status: 400 }
      );
    }

    if (year < 2027 || year > 2046) {
      return NextResponse.json(
        { error: '年份范围: 2027-2046' },
        { status: 400 }
      );
    }

    if (targetRevenue <= 0) {
      return NextResponse.json(
        { error: 'targetRevenue 必须大于 0' },
        { status: 400 }
      );
    }

    const result = runSimulation(year, targetRevenue);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
