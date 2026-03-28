import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const redis = Redis.fromEnv();
    const data = await redis.get("tracker");
    if (!data) {
      return NextResponse.json({ ok: false, error: "No data yet. Cron hasn't run." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, ...(data as object) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
