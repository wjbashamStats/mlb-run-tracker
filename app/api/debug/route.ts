import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export async function GET() {
  const url = 'https://statsapi.mlb.com/api/v1/schedule?sportId=1&season=2026&gameType=R&startDate=2026-03-01&endDate=2026-03-27&hydrate=linescore';
  const res = await fetch(url);
  const data = await res.json();
  const g = data.dates?.[0]?.games?.[0];
  return NextResponse.json({ teams: g?.teams, status: g?.status });
}
