/**
 * Determinism for specs and snapshots: the casual game mints its key with
 * crypto.getRandomValues, so stubbing it before the app boots makes every
 * new game identical. Nothing in the app changes.
 */
export const FIXED_KEY_BYTE = 7;

export function seedScript(): string {
  return `
    const origin = crypto.getRandomValues.bind(crypto);
    let calls = 0;
    crypto.getRandomValues = (arr) => {
      calls += 1;
      if (arr instanceof Uint8Array) {
        for (let i = 0; i < arr.length; i++) arr[i] = (${FIXED_KEY_BYTE} + i * 3) & 0xff;
        return arr;
      }
      return origin(arr);
    };
    localStorage.setItem("lines-game-high-score", "34");
  `;
}
