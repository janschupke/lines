/** Cross-cutting structural cases from 09-identity-sanitization.md. */
export const STRUCTURAL: {
  input: string;
  expect: { ok: false; reason: string } | { ok: true; display: string };
}[] = [
  { input: "", expect: { ok: false, reason: "empty" } },
  { input: "   ", expect: { ok: false, reason: "empty" } },
  { input: "a".repeat(17), expect: { ok: false, reason: "too_long" } },
  {
    input: "日本語のなまえです〜〜〜", // 12 + 3 illegal tildes -> illegal_chars? no: 〜 is Sm
    expect: { ok: false, reason: "illegal_chars" },
  },
  {
    input: "こんにちはこんにちはこんにちはああ",
    expect: { ok: false, reason: "too_long" },
  },
  { input: "🎮gamer", expect: { ok: false, reason: "illegal_chars" } },
  { input: "123456", expect: { ok: false, reason: "no_letters" } },
  { input: "á́́", expect: { ok: false, reason: "zalgo" } },
  { input: "ab​cd", expect: { ok: true, display: "abcd" } },
  { input: "‮evil", expect: { ok: true, display: "evil" } },
  { input: "  Jan   Schupke  ", expect: { ok: true, display: "Jan Schupke" } },
  { input: "ｇａｍｅｒ", expect: { ok: true, display: "gamer" } },
];
