import type { Coord } from "@features/game/types";

/**
 * Coordinate utility functions
 *
 * Provides type-safe operations on coordinates
 */

/**
 * Create a coordinate from x and y
 */
export function createCoord(x: number, y: number): Coord {
  return { x, y };
}

/**
 * Create a coordinate from a tuple
 */
export function coordFromTuple([x, y]: [number, number]): Coord {
  return { x, y };
}

/**
 * Convert coordinate to tuple
 */
export function coordToTuple(coord: Coord): [number, number] {
  return [coord.x, coord.y];
}

/**
 * Convert coordinate to string key (for Sets/Maps)
 */
export function coordToKey(coord: Coord): string {
  return `${coord.x},${coord.y}`;
}

/**
 * Parse coordinate from string key
 */
export function coordFromKey(key: string): Coord {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

/**
 * Check if two coordinates are equal
 */
export function coordsEqual(a: Coord, b: Coord): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Check if coordinate is within board bounds
 */
export function isCoordInBounds(
  coord: Coord,
  boardSize: number = 9,
): boolean {
  return (
    coord.x >= 0 &&
    coord.x < boardSize &&
    coord.y >= 0 &&
    coord.y < boardSize
  );
}

/**
 * Get all coordinates in a set from string keys
 */
export function coordsFromKeys(keys: Set<string>): Coord[] {
  return Array.from(keys).map(coordFromKey);
}

/**
 * Get string keys from coordinates
 */
export function coordsToKeys(coords: Coord[]): Set<string> {
  return new Set(coords.map(coordToKey));
}

/**
 * Convert array of tuples to coordinates
 */
export function coordsFromTuples(tuples: [number, number][]): Coord[] {
  return tuples.map(coordFromTuple);
}

/**
 * Convert coordinates to array of tuples
 */
export function coordsToTuples(coords: Coord[]): [number, number][] {
  return coords.map(coordToTuple);
}

