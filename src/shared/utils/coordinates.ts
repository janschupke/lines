import type { Coord } from "@features/game/types";

/**
 * Coordinate utility functions
 *
 * Provides type-safe operations on coordinates
 */

/**
 * Convert coordinate to string key (for Sets/Maps)
 */
export function coordToKey(coord: Coord): string {
  return `${coord.x},${coord.y}`;
}

/**
 * Parse coordinate from string key
 */
function coordFromKey(key: string): Coord {
  const parts = key.split(",").map(Number);
  const x = parts[0] ?? 0;
  const y = parts[1] ?? 0;
  return { x, y };
}

/**
 * Get all coordinates in a set from string keys
 */
export function coordsFromKeys(keys: Set<string>): Coord[] {
  return Array.from(keys).map(coordFromKey);
}
