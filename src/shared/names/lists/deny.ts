/**
 * Curated additions for what the generic lists miss: impersonation terms
 * and audience-specific slurs. Matched on the folded token or the whole
 * separator-stripped name.
 */
export const DENY: readonly string[] = [
  // impersonation
  "admin",
  "administrator",
  "moderator",
  "mod",
  "system",
  "official",
  "lines",
  "staff",
  "support",
  // high-signal slurs the LDNOOBW lists miss or spell differently
  "nazi",
  "hitler",
  // core Cyrillic profanity — the vendored ru list is transliterated
  "пизда",
  "мудак",
  "блядь",
  "хуй",
  "ебать",
  "сука",
  // gaps in the pt/tr/ja lists
  "buceta",
  "viado",
  "yarrak",
  "pezevenk",
  "pierdol",
  "spierdalaj",
  "くたばれ",
  "きちがい",
];
