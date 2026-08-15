/**
 * The normalisation pipeline. The output is what gets stored and displayed.
 * Order matters; see 09-identity-sanitization.md.
 */

type NormalizeFailure =
  | "empty"
  | "too_long"
  | "illegal_chars"
  | "no_letters"
  | "zalgo";

export type NormalizeResult =
  | { ok: true; display: string }
  | { ok: false; reason: NormalizeFailure };

const MAX_GRAPHEMES = 16;

// C0/C1 controls, zero-width chars, bidi overrides, variation selectors, tags.
// Bidi overrides matter specifically: a name could visually render as a
// different string than what is stored and matched.
const INVISIBLES =
  // eslint-disable-next-line no-control-regex, no-misleading-character-class -- deliberate: these ARE the invisibles being stripped
  /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\ufeff\u202a-\u202e\u2066-\u2069\ufe00-\ufe0f\u{e0000}-\u{e007f}]/gu;

// Unicode letters, marks, digits, plus space, - _ ' .
const ALLOWED = /^[\p{L}\p{M}\p{N} \-_'.]*$/u;

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

function graphemeCount(s: string): number {
  let n = 0;
  for (const _ of segmenter.segment(s)) n++;
  return n;
}

/** Reject if any base character carries more than one combining mark. */
function hasZalgo(s: string): boolean {
  let run = 0;
  for (const ch of s) {
    if (/\p{M}/u.test(ch)) {
      run++;
      if (run > 1) return true;
    } else {
      run = 0;
    }
  }
  return false;
}

export function normalizeName(raw: string): NormalizeResult {
  // 1. NFKC folds fullwidth forms, ligatures, compatibility variants.
  let s = raw.normalize("NFKC");
  // 2. Strip invisibles.
  s = s.replace(INVISIBLES, "");
  // 3. Zalgo check.
  if (hasZalgo(s)) return { ok: false, reason: "zalgo" };
  // 4. Collapse whitespace.
  s = s.replace(/\s+/g, " ").trim();
  if (s.length === 0) return { ok: false, reason: "empty" };
  // 5. Character allowlist — everything else (emoji included) is rejected.
  if (!ALLOWED.test(s)) return { ok: false, reason: "illegal_chars" };
  // 6. Must contain at least one letter.
  if (!/\p{L}/u.test(s)) return { ok: false, reason: "no_letters" };
  // 7. 1..16 grapheme clusters.
  if (graphemeCount(s) > MAX_GRAPHEMES)
    return { ok: false, reason: "too_long" };
  return { ok: true, display: s };
}
