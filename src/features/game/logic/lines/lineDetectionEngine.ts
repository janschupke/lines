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
   * Check if two cells are adjacent (including diagonals)
   */
  private areAdjacent(x1: number, y1: number, x2: number, y2: number): boolean {
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    // Adjacent if they differ by at most 1 in both x and y
    return dx <= 1 && dy <= 1 && dx + dy > 0;
  }

  /**
   * Verify that all cells in a line are connected (adjacent to each other)
   */
  private verifyLineContinuity(lineCells: [number, number][]): boolean {
    if (lineCells.length < 2) return true;
    // Check that each cell is adjacent to the next one
    for (let i = 0; i < lineCells.length - 1; i++) {
      const [x1, y1] = lineCells[i]!;
      const [x2, y2] = lineCells[i + 1]!;
      if (!this.areAdjacent(x1, y1, x2, y2)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Find all lines that pass through a given position
   * Only detects continuous lines where all balls are touching
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
          // Verify this cell is adjacent to the last cell in the line
          const lastCell = lineCells[lineCells.length - 1];
          if (lastCell && this.areAdjacent(lastCell[0], lastCell[1], nx, ny)) {
            lineCells.push([nx, ny]);
          } else {
            // Not adjacent - stop building this line
            break;
          }
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
          // Verify this cell is adjacent to the first cell in the line
          const firstCell = lineCells[0];
          if (
            firstCell &&
            this.areAdjacent(firstCell[0], firstCell[1], nx, ny)
          ) {
            lineCells.unshift([nx, ny]);
          } else {
            // Not adjacent - stop building this line
            break;
          }
        } else {
          break;
        }
        nx -= dx;
        ny -= dy;
      }
      // Verify the entire line is continuous before adding it
      if (
        lineCells.length >= MIN_LINE_LENGTH &&
        this.verifyLineContinuity(lineCells)
      ) {
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
