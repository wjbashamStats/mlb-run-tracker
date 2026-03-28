export const TEAMS = [
  { abbr: "ARI", name: "Arizona Diamondbacks", mlbId: 109 },
  { abbr: "ATL", name: "Atlanta Braves", mlbId: 144 },
  { abbr: "BAL", name: "Baltimore Orioles", mlbId: 110 },
  { abbr: "BOS", name: "Boston Red Sox", mlbId: 111 },
  { abbr: "CHC", name: "Chicago Cubs", mlbId: 112 },
  { abbr: "CWS", name: "Chicago White Sox", mlbId: 145 },
  { abbr: "CIN", name: "Cincinnati Reds", mlbId: 113 },
  { abbr: "CLE", name: "Cleveland Guardians", mlbId: 114 },
  { abbr: "COL", name: "Colorado Rockies", mlbId: 115 },
  { abbr: "DET", name: "Detroit Tigers", mlbId: 116 },
  { abbr: "HOU", name: "Houston Astros", mlbId: 117 },
  { abbr: "KC", name: "Kansas City Royals", mlbId: 118 },
  { abbr: "LAA", name: "Los Angeles Angels", mlbId: 108 },
  { abbr: "LAD", name: "Los Angeles Dodgers", mlbId: 119 },
  { abbr: "MIA", name: "Miami Marlins", mlbId: 146 },
  { abbr: "MIL", name: "Milwaukee Brewers", mlbId: 158 },
  { abbr: "MIN", name: "Minnesota Twins", mlbId: 142 },
  { abbr: "NYM", name: "New York Mets", mlbId: 121 },
  { abbr: "NYY", name: "New York Yankees", mlbId: 147 },
  { abbr: "OAK", name: "Oakland Athletics", mlbId: 133 },
  { abbr: "PHI", name: "Philadelphia Phillies", mlbId: 143 },
  { abbr: "PIT", name: "Pittsburgh Pirates", mlbId: 134 },
  { abbr: "SD", name: "San Diego Padres", mlbId: 135 },
  { abbr: "SF", name: "San Francisco Giants", mlbId: 137 },
  { abbr: "SEA", name: "Seattle Mariners", mlbId: 136 },
  { abbr: "STL", name: "St. Louis Cardinals", mlbId: 138 },
  { abbr: "TB", name: "Tampa Bay Rays", mlbId: 139 },
  { abbr: "TEX", name: "Texas Rangers", mlbId: 140 },
  { abbr: "TOR", name: "Toronto Blue Jays", mlbId: 141 },
  { abbr: "WSH", name: "Washington Nationals", mlbId: 120 },
];

const ID_TO_ABBR: Record<number, string> = {};
TEAMS.forEach((t) => { ID_TO_ABBR[t.mlbId] = t.abbr; });

export type TeamGrid = Record<string, (string | false)[]>;

export function initGrid(): TeamGrid {
  const g: TeamGrid = {};
  TEAMS.forEach((t) => { g[t.abbr] = new Array(14).fill(false); });
  return g;
}

export function logoUrl(mlbId: number) {
  return "https://www.mlbstatic.com/team-logos/" + mlbId + ".svg";
}

export async function fetchSeasonGrid(): Promise<{ grid: TeamGrid; gameCount: number }> {
  const season = 2026;
  const today = new Date().toISOString().slice(0, 10);
  const url = "https://statsapi.mlb.com/api/v1/schedule?sportId=1&season=" + season + "&gameType=R&startDate=" + season + "-03-01&endDate=" + today + "&hydrate=linescore";

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("MLB API error: " + res.status);
  const data = await res.json();

  const grid = initGrid();
  let gameCount = 0;

  for (const d of data.dates ?? []) {
    const date: string = d.date;
    for (const game of d.games ?? []) {
      if (game.status?.abstractGameState !== "Final") continue;
      for (const side of [game.teams?.away, game.teams?.home]) {
        if (!side) continue;
        const teamId: number = side.team?.id;
        const abbr = ID_TO_ABBR[teamId];
        const runs = Number(side.score);
        if (abbr && abbr in grid && !isNaN(runs) && runs >= 0 && runs <= 13) {
          if (grid[abbr][runs] === false) {
            grid[abbr][runs] = date;
          }
        }
      }
      gameCount++;
    }
  }

  return { grid, gameCount };
}