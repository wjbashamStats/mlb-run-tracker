"use client";

import { useEffect, useState, useCallback } from "react";
import { TEAMS, logoUrl } from "../lib/mlb";

type TeamGrid = Record<string, (string | false)[]>;

interface TrackerState {
  grid: TeamGrid;
  updatedAt: string | null;
  gameCount: number;
}

const ROWS = 14;

export default function Home() {
  const [state, setState] = useState<TrackerState>({
    grid: Object.fromEntries(TEAMS.map((t) => [t.abbr, new Array(ROWS).fill(false)])),
    updatedAt: null,
    gameCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"" | "ok" | "err">("");

  const setMsg = (msg: string, type: "" | "ok" | "err" = "") => {
    setStatus(msg);
    setStatusType(type);
  };

  const loadState = useCallback(async () => {
    try {
      const res = await fetch("/api/state");
      const data = await res.json();
      if (data.ok) {
        setState({ grid: data.grid, updatedAt: data.updatedAt, gameCount: data.gameCount });
        setMsg("Grid loaded — " + data.gameCount + " games processed.", "ok");
      } else {
        setMsg(data.error || "No data yet.", "err");
      }
    } catch {
      setMsg("Could not reach server.", "err");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadState(); }, [loadState]);

  async function syncNow() {
    setSyncing(true);
    setMsg("Syncing from MLB API…");
    try {
      const res = await fetch("/api/cron");
      const data = await res.json();
      if (data.ok) {
        setMsg("Synced! " + data.gameCount + " games processed.", "ok");
        await loadState();
      } else {
        setMsg(data.error || "Sync failed.", "err");
      }
    } catch {
      setMsg("Sync request failed.", "err");
    } finally {
      setSyncing(false);
    }
  }

  const completions = TEAMS.map((t) => ({
    ...t,
    count: (state.grid[t.abbr] || []).filter(Boolean).length,
  })).sort((a, b) => b.count - a.count);

  const winner = completions.find((t) => t.count === ROWS);
  const maxCount = completions[0]?.count ?? 0;

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  const fmtDate = (d: string) => {
    const parts = d.split("-");
    return parts[1] + "/" + parts[2];
  };

  return (
    <main>
      <div className="top-bar">
        <div>
          <h1>⚾ Run Total Tracker</h1>
          <p className="subtitle">First team to score every total 0–13 across the 2026 season wins the pot</p>
        </div>
        <div className="controls">
          <button className="btn-sync" onClick={syncNow} disabled={syncing || loading}>
            {syncing ? "Syncing…" : "↻ Sync Now"}
          </button>
        </div>
      </div>

      {status && <div className={"status status-" + statusType}>{status}</div>}
      {state.updatedAt && (
        <div className="last-updated">Last auto-synced: {fmt(state.updatedAt)} · auto-refreshes daily at 8 AM CT</div>
      )}

      {winner && (
        <div className="winner-banner">
          🏆 <strong>{winner.name} ({winner.abbr})</strong> has scored every run total 0–13 — they win the pot!
        </div>
      )}

      <div className="leaderboard">
        {completions.map((t) => (
          <div key={t.abbr} className={"chip" + (t.count === maxCount && maxCount > 0 ? " chip-lead" : "")}>
            <img src={logoUrl(t.mlbId)} alt={t.abbr} className="chip-logo" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <span>{t.abbr}</span>
            <span className="chip-count">{t.count}/14</span>
          </div>
        ))}
      </div>

      <div className="grid-scroll">
        {loading ? (
          <div className="loading">Loading…</div>
        ) : (
          <table className="grid">
            <thead>
              <tr>
                <th className="corner" />
                {TEAMS.map((t) => (
                  <th key={t.abbr} className="team-th" title={t.name}>
                    <img src={logoUrl(t.mlbId)} alt={t.abbr} className="th-logo" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <div className="th-abbr">{t.abbr}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROWS }, (_, r) => (
                <tr key={r}>
                  <td className="row-label">{r}</td>
                  {TEAMS.map((t) => {
                    const val = state.grid[t.abbr]?.[r] ?? false;
                    const done = !!val;
                    const date = typeof val === "string" ? val : null;
                    return (
                      <td key={t.abbr} className={"cell" + (done ? " cell-done" : "")} title={t.abbr + " — " + r + " runs" + (date ? " on " + date : "")}>
                        {done ? (
                          <div className="cell-inner">
                            <span className="check">✓</span>
                            {date && <span className="cell-date">{fmtDate(date)}</span>}
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #0a0e1a; color: #e8eaf0; min-height: 100vh; }
        main { max-width: 100%; padding: 1.5rem 1.25rem 3rem; }
        .top-bar { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
        h1 { font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em; color: #f0f2f8; }
        .subtitle { font-size: 0.8rem; color: #6b7280; margin-top: 3px; }
        .controls { display: flex; gap: 8px; align-items: center; }
        .btn-sync { font-family: 'DM Mono', monospace; font-size: 0.75rem; padding: 7px 16px; border-radius: 6px; border: 1px solid #2a3a5c; background: #111827; color: #60a5fa; cursor: pointer; letter-spacing: 0.02em; transition: background 0.15s, border-color 0.15s; }
        .btn-sync:hover:not(:disabled) { background: #1e2d4a; border-color: #3b82f6; }
        .btn-sync:disabled { opacity: 0.4; cursor: default; }
        .status { font-family: 'DM Mono', monospace; font-size: 0.72rem; padding: 6px 10px; border-radius: 5px; margin-bottom: 6px; background: #111827; color: #9ca3af; border: 1px solid #1f2937; }
        .status-ok { color: #34d399; border-color: #065f46; background: #052e16; }
        .status-err { color: #f87171; border-color: #7f1d1d; background: #1c0a0a; }
        .last-updated { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: #374151; margin-bottom: 0.75rem; }
        .winner-banner { margin-bottom: 1rem; padding: 12px 16px; border-radius: 8px; background: #052e16; border: 1px solid #065f46; color: #34d399; font-size: 0.9rem; }
        .winner-banner strong { font-weight: 600; }
        .leaderboard { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 1rem; }
        .chip { display: flex; align-items: center; gap: 5px; font-family: 'DM Mono', monospace; font-size: 0.68rem; padding: 3px 8px 3px 5px; border-radius: 20px; border: 1px solid #1f2937; background: #111827; color: #6b7280; }
        .chip-lead { border-color: #065f46; background: #052e16; color: #34d399; }
        .chip-logo { width: 14px; height: 14px; object-fit: contain; }
        .chip-count { font-weight: 500; margin-left: 2px; }
        .grid-scroll { overflow-x: auto; border: 1px solid #1f2937; border-radius: 8px; }
        .loading { padding: 2rem; text-align: center; color: #374151; font-family: 'DM Mono', monospace; font-size: 0.8rem; }
        table.grid { border-collapse: collapse; width: max-content; min-width: 100%; }
        .corner { position: sticky; left: 0; z-index: 4; background: #0d1220; width: 36px; min-width: 36px; }
        .team-th { text-align: center; padding: 6px 2px 8px; min-width: 48px; max-width: 48px; position: sticky; top: 0; z-index: 3; background: #0d1220; border-bottom: 1px solid #1f2937; }
        .th-logo { width: 24px; height: 24px; object-fit: contain; display: block; margin: 0 auto 2px; }
        .th-abbr { font-family: 'DM Mono', monospace; font-size: 7px; color: #4b5563; letter-spacing: 0.04em; text-align: center; }
        .row-label { position: sticky; left: 0; z-index: 2; background: #0d1220; font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; color: #4b5563; text-align: center; width: 36px; min-width: 36px; padding: 0 8px; border-right: 1px solid #1f2937; }
        .cell { width: 48px; height: 42px; border: 0.5px solid #131c2e; text-align: center; vertical-align: middle; transition: background 0.1s; }
        .cell-done { background: #052e16; }
        .cell-inner { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 1px; }
        .check { font-family: 'DM Mono', monospace; font-size: 13px; color: #34d399; line-height: 1; }
        .cell-date { font-family: 'DM Mono', monospace; font-size: 7px; color: #34d399; opacity: 0.6; line-height: 1; }
        tr:hover .cell { background: #111827; }
        tr:hover .cell-done { background: #063b1e; }
        @media (max-width: 640px) { main { padding: 1rem 0.75rem 2rem; } h1 { font-size: 1.2rem; } }
      `}</style>
    </main>
  );
}
