export type CellIndex = number; // 0..80, index = y * 9 + x
export type ColorId = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 0 reserved for "empty"
export type ColorName =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "pink"
  | "black";

/** index 0 is unused so COLOR_NAMES[colorId] works directly. */
export const COLOR_NAMES: readonly (ColorName | "")[] = [
  "",
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "pink",
  "black",
];

export interface GameStats {
  readonly turns: number;
  readonly linesPopped: number;
  readonly longestLine: number;
  readonly ballsCleared: number;
}

export interface GameState {
  readonly balls: Uint8Array; // length 81, ColorId | 0
  readonly ghosts: Uint8Array; // length 81, ColorId | 0; ghosts[i] !== 0 => balls[i] === 0
  readonly score: number;
  readonly moveCount: number;
  readonly over: boolean;
  readonly stats: GameStats;
}

export interface GameAction {
  readonly t: "move";
  readonly from: CellIndex;
  readonly to: CellIndex;
}

export type MoveError =
  | "game_over"
  | "out_of_bounds"
  | "same_cell"
  | "no_ball_at_source"
  | "destination_occupied"
  | "unreachable";

export type EntropyError = "entropy_exhausted" | "entropy_illegal";

export interface PlacedBall {
  readonly c: CellIndex;
  readonly color: ColorId;
}

/** Everything random that happens in one turn. */
export interface SpawnPacket {
  /** The displaced ghost's new cell, if a ghost was stepped on and a free cell existed. */
  readonly relocate?: { readonly to: CellIndex };
  /** New ghosts placed this turn, in emission order. */
  readonly ghosts: readonly PlacedBall[];
}

/** Everything random that happens at game creation. */
export interface InitPacket {
  readonly balls: readonly PlacedBall[];
  readonly ghosts: readonly PlacedBall[];
}

export interface LineRef {
  readonly cells: readonly CellIndex[];
  readonly length: number;
  readonly points: number;
  readonly axis: 0 | 1 | 2 | 3; // H, V, D-down, D-up
}

export type Effect =
  | { k: "move"; color: ColorId; path: readonly CellIndex[] }
  | { k: "ghostMoved"; from: CellIndex; to: CellIndex; color: ColorId }
  | {
      k: "pop";
      cells: readonly CellIndex[];
      lines: readonly LineRef[];
      round: number;
    }
  | { k: "score"; delta: number; total: number; at: CellIndex }
  | { k: "materialize"; cells: readonly PlacedBall[] }
  | { k: "spawnGhosts"; cells: readonly PlacedBall[] }
  | { k: "gameOver"; score: number; stats: GameStats };

export type StepResult =
  | { ok: true; state: GameState; effects: Effect[]; packet: SpawnPacket }
  | { ok: false; error: MoveError | EntropyError };
