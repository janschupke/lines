import { describe, it, expect } from "vitest";
import {
  chachaBlock,
  wordAt,
  belowAt,
  sha256,
  hmacSha256,
  hkdf,
  keyFromHex,
  keyToHex,
  keyedEntropy,
  INIT_STRIDE,
  TURN_STRIDE,
} from "./index";

const hex = (b: Uint8Array) =>
  Array.from(b)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");

describe("ChaCha20", () => {
  it("matches the RFC 8439 §2.3.2 block test vector", () => {
    const key = new Uint8Array(32);
    for (let i = 0; i < 32; i++) key[i] = i;
    const nonce = keyFromHex("000000090000004a00000000");
    const block = chachaBlock(key, 1, nonce);
    expect(Array.from(block, (w) => w.toString(16).padStart(8, "0"))).toEqual([
      "e4e7f110",
      "15593bd1",
      "1fdd0f50",
      "c47120a3",
      "c7f4d1c7",
      "0368c033",
      "9aaa2204",
      "4e6cd4c3",
      "466482d2",
      "09aa9f07",
      "05d7c214",
      "a2028bd9",
      "d19c12b5",
      "b94e16de",
      "e883d0cb",
      "4e3c50a2",
    ]);
  });

  it("wordAt is seekable: word n = word (n%16) of block floor(n/16)", () => {
    const key = keyFromHex("aa".repeat(32));
    expect(wordAt(key, 17)).toBe(chachaBlock(key, 1)[1]);
    expect(wordAt(key, 0)).toBe(chachaBlock(key, 0)[0]);
    // deterministic across calls
    expect(wordAt(key, 999)).toBe(wordAt(key, 999));
  });

  it("belowAt is modulo of the word", () => {
    const key = keyFromHex("bb".repeat(32));
    expect(belowAt(key, 5, 81)).toBe(wordAt(key, 5) % 81);
  });

  it("stream layout: turn 0's first draw is NOT stream position 0", () => {
    // The initial deal owns [0, INIT_STRIDE); turn t starts at
    // INIT_STRIDE + TURN_STRIDE * t. The exact collision an earlier draft had.
    expect(INIT_STRIDE).toBe(32);
    expect(TURN_STRIDE).toBe(16);
    expect(INIT_STRIDE + TURN_STRIDE * 0).not.toBe(0);
  });
});

describe("SHA-256 / HMAC / HKDF", () => {
  it("sha256('abc') matches FIPS vector", () => {
    expect(hex(sha256(new TextEncoder().encode("abc")))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("sha256 empty string", () => {
    expect(hex(sha256(new Uint8Array(0)))).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("hmac-sha256 RFC 4231 test case 2", () => {
    const key = new TextEncoder().encode("Jefe");
    const msg = new TextEncoder().encode("what do ya want for nothing?");
    expect(hex(hmacSha256(key, msg))).toBe(
      "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
    );
  });

  it("hkdf RFC 5869 test case 1", () => {
    const ikm = keyFromHex("0b".repeat(22));
    const salt = keyFromHex("000102030405060708090a0b0c");
    const info = keyFromHex("f0f1f2f3f4f5f6f7f8f9");
    expect(hex(hkdf(ikm, salt, info, 42))).toBe(
      "3cb25f25faacd57a90434f64d0362f2a" +
        "2d2d0a90cf1a5a4c5db02d56ecc4c5bf" +
        "34007208d5b887185865",
    );
  });
});

describe("keys", () => {
  it("keyedEntropy rejects keys under 16 bytes (Z11)", () => {
    expect(() => keyedEntropy(new Uint8Array(15))).toThrow();
    expect(() => keyedEntropy(new Uint8Array(8))).toThrow();
  });

  it("hex round trip", () => {
    const key = keyFromHex("00ff10ab".repeat(8));
    expect(keyToHex(key)).toBe("00ff10ab".repeat(8));
    expect(() => keyFromHex("zz")).toThrow();
    expect(() => keyFromHex("abc")).toThrow();
  });
});
