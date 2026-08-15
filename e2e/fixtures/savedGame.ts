// Deterministic saved game seeded into localStorage before load.
// The app is non-deterministic (Math.random spawns), so visual baselines
// and DOM assertions rely on the restore-from-storage path instead.

type BallColor =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "pink"
  | "black";

interface FixtureCell {
  x: number;
  y: number;
  ball: { color: BallColor } | null;
  incomingBall: { color: BallColor } | null;
  active: boolean;
}

const BOARD_SIZE = 9;

export const FIXTURE_BALLS: [number, number, BallColor][] = [
  [1, 1, "red"],
  [4, 1, "blue"],
  [7, 2, "green"],
  [2, 4, "yellow"],
  [4, 4, "purple"],
  [6, 5, "pink"],
  [3, 6, "black"],
  [5, 7, "red"],
];

export const FIXTURE_GHOSTS: [number, number, BallColor][] = [
  [0, 8, "blue"],
  [8, 0, "green"],
  [8, 8, "yellow"],
];

export function buildSavedGame() {
  const board: FixtureCell[][] = Array.from({ length: BOARD_SIZE }, (_, y) =>
    Array.from({ length: BOARD_SIZE }, (_, x) => ({
      x,
      y,
      ball: null as { color: BallColor } | null,
      incomingBall: null as { color: BallColor } | null,
      active: false,
    })),
  );
  for (const [x, y, color] of FIXTURE_BALLS) {
    board[y]![x]!.ball = { color };
  }
  for (const [x, y, color] of FIXTURE_GHOSTS) {
    board[y]![x]!.incomingBall = { color };
  }
  return {
    board,
    score: 13,
    highScore: 34,
    nextBalls: ["red", "green", "blue"] as BallColor[],
    timer: 42,
    timerActive: false,
    gameOver: false,
    statistics: { turnsCount: 7, linesPopped: 2, longestLinePopped: 6 },
  };
}

export const GAME_STATE_STORAGE_KEY = "lines-game-state";
export const HIGH_SCORE_STORAGE_KEY = "lines-game-high-score";

/** addInitScript payload: seed the fixture before the app boots. */
export function seedScript(): string {
  const saved = JSON.stringify(buildSavedGame());
  return `
    localStorage.setItem(${JSON.stringify(GAME_STATE_STORAGE_KEY)}, ${JSON.stringify(saved)});
    localStorage.setItem(${JSON.stringify(HIGH_SCORE_STORAGE_KEY)}, "34");
  `;
}
