/**
 * Name validation: normalisation + three matchers (obscenity for English,
 * folded LDNOOBW wordlists, curated deny list), with a false-positive
 * allowlist checked first. Imported by both the client (instant feedback)
 * and the server (authoritative — the client's verdict is never trusted).
 */
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";
import { normalizeName } from "./normalize";
import { foldName, foldTerm } from "./fold";
import * as ldnoobw from "./lists/ldnoobw";
import { DENY } from "./lists/deny";
import { ALLOW } from "./lists/allow";

export type NameVerdict =
  | { ok: true; display: string; folded: string }
  | {
      ok: false;
      reason:
        | "empty"
        | "too_long"
        | "illegal_chars"
        | "no_letters"
        | "zalgo"
        | "rejected";
    };

const englishMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

// Word-boundary languages: match folded tokens + the stripped whole string.
const BOUNDARY_LANGS = [
  "en",
  "cs",
  "de",
  "es",
  "fr",
  "it",
  "pl",
  "pt",
  "ru",
  "tr",
  "ar",
] as const;

// Scripts without spaces: substring matching against the folded string, but
// only for terms from those languages' lists.
const SUBSTRING_LANGS = ["zh", "ja", "ko"] as const;

const boundaryTerms = new Set<string>();
for (const lang of BOUNDARY_LANGS) {
  for (const term of ldnoobw[lang]) {
    const folded = foldTerm(term);
    if (folded.length > 0) boundaryTerms.add(folded);
  }
}
for (const term of DENY) boundaryTerms.add(foldTerm(term));

const substringTerms: string[] = [];
for (const lang of SUBSTRING_LANGS) {
  for (const term of ldnoobw[lang]) {
    const folded = foldTerm(term);
    if (folded.length < 2) continue;
    // The CJK lists carry some Latin terms ("sm", "xx", "3p") whose folds
    // would substring-match half of all names. Substring matching is only
    // for actual no-space scripts; ASCII-folding terms go through the
    // word-boundary set instead.
    // eslint-disable-next-line no-control-regex -- ASCII range test
    if (/^[\x00-\x7f]+$/.test(folded)) {
      boundaryTerms.add(folded);
    } else {
      substringTerms.push(folded);
    }
  }
}

const allowSet = new Set(ALLOW.map(foldTerm));

export function validateName(raw: string): NameVerdict {
  const normalized = normalizeName(raw);
  if (!normalized.ok) return normalized;
  const display = normalized.display;
  const { folded, stripped } = foldName(display);

  // The allowlist short-circuits everything.
  if (allowSet.has(stripped)) {
    return { ok: true, display, folded };
  }
  const { deduped } = foldName(display);
  const tokens = folded.split(" ").filter(Boolean);
  const checkedTokens = tokens.filter((t) => !allowSet.has(t));

  // 1. obscenity, against the normalised display string (its transformers
  //    do their own folding — feeding it our folded string would double-fold).
  if (englishMatcher.hasMatch(display)) {
    return { ok: false, reason: "rejected" };
  }

  // 2. folded wordlists: word-boundary tokens, the separator-stripped
  //    whole, and the letter-run-deduped forms (kurvaaa -> kurva).
  for (const token of checkedTokens) {
    if (boundaryTerms.has(token)) return { ok: false, reason: "rejected" };
    if (boundaryTerms.has(token.replace(/(.)\1+/gu, "$1"))) {
      return { ok: false, reason: "rejected" };
    }
  }
  if (boundaryTerms.has(stripped)) return { ok: false, reason: "rejected" };
  if (boundaryTerms.has(deduped)) return { ok: false, reason: "rejected" };

  // 2b. CJK substring matching.
  for (const term of substringTerms) {
    if (stripped.includes(term)) return { ok: false, reason: "rejected" };
  }

  return { ok: true, display, folded };
}
