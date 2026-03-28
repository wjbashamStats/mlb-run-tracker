import { kv } from "@vercel/kv";
import { fetchSeasonGrid } from "../../../lib/mlb";
import { NextResponse } from "next/server";

// Vercel Cron calls this with a special header — protect it
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { grid, gameCount } = await fetchSeasonGrid();
    const updatedAt = new Date().toISOString();
    await kv.set("tracker", { grid, updatedAt, gameCount });
    return NextResponse.json({ ok: true, gameCount, updatedAt });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Cron error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
