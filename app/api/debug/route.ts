import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET() {
  const url = "https://statsapi.mlb.com/api/v1/schedule?sportId=1&season=2026&gameType=R&startDate=2026-03-01&endDate=2026-03-27&hydrate=linescore";
  const res = await fetch(url);
  const data = await res.json();
  const sample = (data.dates ?? []).flatMap((d: any) => (d.games ?? []).map((g: any) => ({ date: d.date, status: g.status?.abstractGameState, away: { abbr: g.teams?.away?.team?.abbreviation, score: g.teams?.away?.score }, home: { abbr: g.teams?.home?.team?.abbreviation, score: g.teams?.home?.score } }))).slice(0, 5);
  return NextResponse.json({ sample });
}