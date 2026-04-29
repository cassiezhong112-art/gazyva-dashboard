import { NextRequest, NextResponse } from 'next/server';
import { generateAiResponse } from '@/lib/ai-engine';

export async function POST(request: NextRequest) {
  try {
    const { message, currentYear } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: '请输入消息' }, { status: 400 });
    }

    const year = currentYear || 2027;

    // TODO: When Gemini API key is available, replace generateAiResponse
    // with a real Gemini API call:
    //
    // const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=YOUR_KEY', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    // });

    const response = generateAiResponse(message, year);

    return NextResponse.json(response);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
