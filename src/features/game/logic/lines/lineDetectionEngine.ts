import { BOARD_SIZE, MIN_LINE_LENGTH, SCORING_TABLE } from "../../config";
import type {
  Cell,
  BallColor,
  Line,
  LineDetectionResult,
  LineDirection,
} from "../../types";
import { LineDirection as LineDirectionEnum } from "../../types/enums";
import { coordsFromKeys, coordToKey } from "@shared/utils/coordinates";

type Direction = [number, number];

const DIRECTIONS: Direction[] = [
  [1, 0], // horizontal
  [0, 1], // vertical
  [1, 1], // diagonal down-right
  [1, -1], // diagonal up-right
];

const DIRECTION_TO_ENUM: Record<string, LineDirection> = {
  "1,0": LineDirectionEnum.Horizontal,
  "0,1": LineDirectionEnum.Vertical,
  "1,1": LineDirectionEnum.DiagonalDown,
  "1,-1": LineDirectionEnum.DiagonalUp,
};

/**
 * Line Detection Engine
 *
 * Encapsulates all line detection logic with clear interface
 */
export class LineDetectionEngine {
  /**
   * Detects all lines passing through a given position
   * Returns null if no lines found
   */
  detectLinesAtPosition(
    board: Cell[][],
    position: [number, number],
  ): LineDetectionResult | null {
    const [x, y] = position;
    const row = board[y];
    if (!row) return null;
    const cell = row[x];
    if (!cell) return null;
    const ball = cell.ball;
    if (!ball) return null;

    const lines = this.findLines(board, x, y, ball.color);
    if (lines.length === 0) return null;

    const ballsToRemoveSet = new Set<string>();
    lines.forEach((line) => {
      line.cells.forEach(([cx, cy]) => {
        ballsToRemoveSet.add(coordToKey({ x: cx, y: cy }));
      });
    });

    const ballsToRemove: [number, number][] = coordsFromKeys(
      ballsToRemoveSet,
    ).map((coord) => [coord.x, coord.y]);

    const score = this.calculateTotalScore(lines);

    return {
      lines,
      ballsToRemove,
      score,
    };
  }

  /**
   * Detects all lines passing through any of the given positions
   * Deduplicates overlapping lines
   */
  detectLinesAtPositions(
    board: Cell[][],
    positions: [number, number][],
  ): LineDetectionResult | null {
    const allLines: Line[] = [];
    const ballsToRemoveSet = new Set<string>();

    // Check for lines at each position
    for (const [x, y] of positions) {
      const row = board[y];
      if (!row) continue;
      const cell = row[x];
      if (!cell) continue;
      const ball = cell.ball;
      if (!ball) continue;

      const lines = this.findLines(board, x, y, ball.color);
      lines.forEach((line) => {
        // Check if this line is already covered
        const lineKey = line.cells
          .map(([lx, ly]) => coordToKey({ x: lx, y: ly }))
          .sort()
          .join("|");
        const existingLine = allLines.find((existingLine) => {
          const existingKey = existingLine.cells
            .map(([lx, ly]) => coordToKey({ x: lx, y: ly }))
            .sort()
            .join("|");
          return existingKey === lineKey;
        });

        if (!existingLine) {
          allLines.push(line);
          line.cells.forEach(([lx, ly]) => {
            ballsToRemoveSet.add(coordToKey({ x: lx, y: ly }));
          });
        }
      });
    }

    if (ballsToRemoveSet.size === 0) return null;

    const ballsToRemove: [number, number][] = coordsFromKeys(
      ballsToRemoveSet,
    ).map((coord) => [coord.x, coord.y]);

    const score = this.calculateTotalScore(allLines);

    return {
      lines: allLines,
      ballsToRemove,
      score,
    };
  }

  /**
   * Checks if a line is valid (meets minimum length requirement)
   */
  isValidLine(line: Line): boolean {
    return line.length >= MIN_LINE_LENGTH;
  }

  /**
   * Calculates score for a line
   */
  calculateLineScore(line: Line): number {
    if (!this.isValidLine(line)) return 0;

    const score = SCORING_TABLE[line.length];
    if (score !== undefined) {
      return score;
    }

    // For line lengths beyond the table, return the maximum available score
    const maxScore = Math.max(...Object.values(SCORING_TABLE));
    return maxScore;
  }

  /**
   * Find all lines that pass through a given position
   */
  private findLines(
    board: Cell[][],
    x: number,
    y: number,
    color: BallColor,
  ): Line[] {
    const lines: Line[] = [];
    for (const [dx, dy] of DIRECTIONS) {
      const lineCells: [number, number][] = [[x, y]];
      // Forward
      let nx = x + dx,
        ny = y + dy;
      while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
        const forwardRow = board[ny];
        const forwardCell = forwardRow?.[nx];
        if (
          forwardCell &&
          forwardCell.ball &&
          forwardCell.ball.color === color
        ) {
          lineCells.push([nx, ny]);
        } else {
          break;
        }
        nx += dx;
        ny += dy;
      }
      // Backward
      nx = x - dx;
      ny = y - dy;
      while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
        const backwardRow = board[ny];
        const backwardCell = backwardRow?.[nx];
        if (
          backwardCell &&
          backwardCell.ball &&
          backwardCell.ball.color === color
        ) {
          lineCells.unshift([nx, ny]);
        }
        nx -= dx;
        ny -= dy;
      }
      if (lineCells.length >= MIN_LINE_LENGTH) {
        const direction = this.getDirectionForVector(dx, dy);
        lines.push({
          cells: lineCells,
          color,
          length: lineCells.length,
          direction,
        });
      }
    }
    return lines;
  }

  /**
   * Calculate total score for multiple lines
   * Each line is scored separately
   */
  private calculateTotalScore(lines: Line[]): number {
    return lines.reduce(
      (total, line) => total + this.calculateLineScore(line),
      0,
    );
  }

  /**
   * Get direction enum for a direction vector
   */
  private getDirectionForVector(dx: number, dy: number): LineDirection {
    const key = `${dx},${dy}`;
    return DIRECTION_TO_ENUM[key] || LineDirectionEnum.Horizontal;
  }
}
