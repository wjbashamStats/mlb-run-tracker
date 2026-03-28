import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET() {
  const url = "https://statsapi.mlb.com/api/v1/schedule?sportId=1&season=2026&gameType=R&startDate=2026-03-01&endDate=2026-03-27&hydrate=linescore";
  const res = await fetch(url);
  const data = await res.json();
  const firstGame = data.dates?.[0]?.games?.[0];
  return NextResponse.json({ away_team: firstGame?.teams?.away?.team, home_team: firstGame?.teams?.home?.team, away_score: firstGame?.teams?.away?.score, home_score: firstGame?.teams?.home?.score });
}