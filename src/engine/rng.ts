/**
 * ChaCha20 (counter-based) + HKDF-SHA256, pure integer ops only.
 *
 * The nonce is a constant 96-bit zero and the 32-bit block counter is
 * floor(streamPos / 16). Safe because every key is unique per game, so no
 * key is ever reused with the same counter. Do not add a nonce parameter.
 *
 * Chosen over small-state PRNGs deliberately: a generator whose state is
 * recoverable from observed outputs would hand a Ranked client full
 * foreknowledge of the spawn stream. See 02-engine.md.
 */

export type Key = Uint8Array; // 32 bytes (256-bit)

/** Stream positions are fixed by construction, never by consumption. */
export const INIT_STRIDE = 32; // positions 0..31 reserved for the initial deal
export const TURN_STRIDE = 16; // one 64-byte ChaCha20 block per turn

const rotl = (v: number, n: number): number =>
  ((v << n) | (v >>> (32 - n))) >>> 0;

function quarterRound(
  s: Uint32Array,
  a: number,
  b: number,
  c: number,
  d: number,
): void {
  s[a] = (s[a]! + s[b]!) >>> 0;
  s[d] = rotl(s[d]! ^ s[a]!, 16);
  s[c] = (s[c]! + s[d]!) >>> 0;
  s[b] = rotl(s[b]! ^ s[c]!, 12);
  s[a] = (s[a]! + s[b]!) >>> 0;
  s[d] = rotl(s[d]! ^ s[a]!, 8);
  s[c] = (s[c]! + s[d]!) >>> 0;
  s[b] = rotl(s[b]! ^ s[c]!, 7);
}

const SIGMA = new Uint32Array([0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]);

const readLE32 = (b: Uint8Array, off: number): number =>
  (b[off]! | (b[off + 1]! << 8) | (b[off + 2]! << 16) | (b[off + 3]! << 24)) >>>
  0;

/**
 * One 64-byte ChaCha20 block as 16 uint32 words.
 * `nonce` defaults to the constant zero nonce; the parameter exists only so
 * tests can check the RFC 8439 vectors.
 */
export function chachaBlock(
  key: Key,
  counter: number,
  nonce?: Uint8Array,
): Uint32Array {
  if (key.length !== 32) throw new Error("chacha20: key must be 32 bytes");
  const state = new Uint32Array(16);
  state.set(SIGMA, 0);
  for (let i = 0; i < 8; i++) state[4 + i] = readLE32(key, i * 4);
  state[12] = counter >>> 0;
  if (nonce) {
    state[13] = readLE32(nonce, 0);
    state[14] = readLE32(nonce, 4);
    state[15] = readLE32(nonce, 8);
  }
  const w = state.slice();
  for (let i = 0; i < 10; i++) {
    quarterRound(w, 0, 4, 8, 12);
    quarterRound(w, 1, 5, 9, 13);
    quarterRound(w, 2, 6, 10, 14);
    quarterRound(w, 3, 7, 11, 15);
    quarterRound(w, 0, 5, 10, 15);
    quarterRound(w, 1, 6, 11, 12);
    quarterRound(w, 2, 7, 8, 13);
    quarterRound(w, 3, 4, 9, 14);
  }
  for (let i = 0; i < 16; i++) w[i] = (w[i]! + state[i]!) >>> 0;
  return w;
}

/** Draw index n of the stream: word (n % 16) of block floor(n / 16). Seekable. */
export function wordAt(key: Key, streamPos: number): number {
  const blockIndex = (streamPos / 16) | 0;
  return chachaBlock(key, blockIndex)[streamPos % 16]!;
}

export const belowAt = (key: Key, pos: number, n: number): number =>
  wordAt(key, pos) % n;

/** A cursor is just a position. There is no mutable generator state. */
export interface Cursor {
  readonly key: Key;
  pos: number;
}

export const nextBelow = (c: Cursor, n: number): number =>
  belowAt(c.key, c.pos++, n);

// ---------------------------------------------------------------------------
// SHA-256 + HMAC + HKDF (RFC 5869), pure integer ops.
// The `crypto` global is banned inside the engine; this is ~80 lines and
// verified against the RFC test vectors.
// ---------------------------------------------------------------------------

const K256 = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const rotr = (v: number, n: number): number =>
  ((v >>> n) | (v << (32 - n))) >>> 0;

export function sha256(data: Uint8Array): Uint8Array {
  const bitLen = data.length * 8;
  const padded = new Uint8Array((((data.length + 8) >> 6) + 1) << 6);
  padded.set(data);
  padded[data.length] = 0x80;
  const dv = padded;
  // 64-bit big-endian length; JS numbers cover our sizes fine.
  const hi = (bitLen / 0x100000000) | 0;
  const lo = bitLen >>> 0;
  const end = padded.length;
  dv[end - 8] = (hi >>> 24) & 0xff;
  dv[end - 7] = (hi >>> 16) & 0xff;
  dv[end - 6] = (hi >>> 8) & 0xff;
  dv[end - 5] = hi & 0xff;
  dv[end - 4] = (lo >>> 24) & 0xff;
  dv[end - 3] = (lo >>> 16) & 0xff;
  dv[end - 2] = (lo >>> 8) & 0xff;
  dv[end - 1] = lo & 0xff;

  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ]);
  const w = new Uint32Array(64);
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) {
      const j = off + i * 4;
      w[i] =
        ((padded[j]! << 24) |
          (padded[j + 1]! << 16) |
          (padded[j + 2]! << 8) |
          padded[j + 3]!) >>>
        0;
    }
    for (let i = 16; i < 64; i++) {
      const s0 =
        rotr(w[i - 15]!, 7) ^ rotr(w[i - 15]!, 18) ^ (w[i - 15]! >>> 3);
      const s1 = rotr(w[i - 2]!, 17) ^ rotr(w[i - 2]!, 19) ^ (w[i - 2]! >>> 10);
      w[i] = (w[i - 16]! + s0 + w[i - 7]! + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = [
      h[0]!,
      h[1]!,
      h[2]!,
      h[3]!,
      h[4]!,
      h[5]!,
      h[6]!,
      h[7]!,
    ];
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K256[i]! + w[i]!) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      hh = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }
    h[0] = (h[0]! + a) >>> 0;
    h[1] = (h[1]! + b) >>> 0;
    h[2] = (h[2]! + c) >>> 0;
    h[3] = (h[3]! + d) >>> 0;
    h[4] = (h[4]! + e) >>> 0;
    h[5] = (h[5]! + f) >>> 0;
    h[6] = (h[6]! + g) >>> 0;
    h[7] = (h[7]! + hh) >>> 0;
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i++) {
    out[i * 4] = (h[i]! >>> 24) & 0xff;
    out[i * 4 + 1] = (h[i]! >>> 16) & 0xff;
    out[i * 4 + 2] = (h[i]! >>> 8) & 0xff;
    out[i * 4 + 3] = h[i]! & 0xff;
  }
  return out;
}

const concat = (...parts: Uint8Array[]): Uint8Array => {
  let len = 0;
  for (const p of parts) len += p.length;
  const out = new Uint8Array(len);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
};

export function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
  let k = key;
  if (k.length > 64) k = sha256(k);
  const ipad = new Uint8Array(64);
  const opad = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    ipad[i] = (k[i] ?? 0) ^ 0x36;
    opad[i] = (k[i] ?? 0) ^ 0x5c;
  }
  return sha256(concat(opad, sha256(concat(ipad, message))));
}

/** HKDF (RFC 5869) with SHA-256. */
export function hkdf(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number,
): Uint8Array {
  const prk = hmacSha256(salt.length > 0 ? salt : new Uint8Array(32), ikm);
  const blocks: Uint8Array[] = [];
  let prev = new Uint8Array(0);
  const n = ((length + 31) / 32) | 0;
  for (let i = 1; i <= n; i++) {
    prev = hmacSha256(prk, concat(prev, info, new Uint8Array([i])));
    blocks.push(prev);
  }
  return concat(...blocks).slice(0, length);
}

// ---------------------------------------------------------------------------

export function keyFromHex(hex: string): Key {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) {
    throw new Error("keyFromHex: not a hex string");
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function keyToHex(key: Key): string {
  let s = "";
  for (const b of key) s += b.toString(16).padStart(2, "0");
  return s;
}
