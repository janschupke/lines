/**
 * The matching fold. Produces strings used ONLY for matching — never
 * displayed, never stored as the display name.
 */

// Homoglyph fold to Latin: Cyrillic and Greek lookalikes. Fullwidth forms
// and mathematical alphanumerics are already folded by NFKC/NFKD.
const HOMOGLYPHS: Record<string, string> = {
  а: "a", // Cyrillic
  е: "e",
  о: "o",
  р: "p",
  с: "c",
  у: "y",
  х: "x",
  і: "i",
  ѕ: "s",
  ο: "o", // Greek
  ν: "v",
  ρ: "p",
  α: "a",
  ε: "e",
  ι: "i",
  κ: "k",
  τ: "t",
  υ: "u",
  ı: "i", // Turkish dotless i — amcık folds to amcik
};

const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "!": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "@": "a",
  $: "s",
  "(": "c",
};

export interface FoldedName {
  /** The fold of the display string, separators preserved as spaces. */
  folded: string;
  /** The fold with all separators removed — catches f.u.c.k. */
  stripped: string;
  /** stripped with every letter-run collapsed to one — catches kurvaaa. */
  deduped: string;
}

export function foldName(display: string): FoldedName {
  // Lowercase locale-independently (avoids the Turkish dotted-I surprise),
  // then NFKD + strip marks so a/á/ä all fold together.
  let s = display.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "");
  let out = "";
  for (const ch of s) {
    out += HOMOGLYPHS[ch] ?? LEET[ch] ?? ch;
  }
  // Elongation collapse: runs of >=3 identical letters -> 2.
  s = out.replace(/(.)\1{2,}/gu, "$1$1");
  const folded = s.replace(/[-_.'\s]+/g, " ").trim();
  const stripped = s.replace(/[-_.'\s]+/g, "");
  const deduped = stripped.replace(/(.)\1+/gu, "$1");
  return { folded, stripped, deduped };
}

/** Fold a wordlist term the same way names are folded. */
export function foldTerm(term: string): string {
  return foldName(term).stripped;
}
