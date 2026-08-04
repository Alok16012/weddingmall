/**
 * Text normalisation for the PDF.
 *
 * Kept free of any `@react-pdf/renderer` import on purpose: the preview screen
 * needs `hasUnsupportedScript` to warn the user, and if that pulled in the
 * renderer, the 2 MB PDF engine would land in the main bundle instead of the
 * lazy chunk it belongs in.
 */

/**
 * Characters the base-14 WinAnsi encoding cannot represent, mapped to
 * equivalents it can. The rupee sign is the one that matters in practice —
 * it is not in WinAnsi, so "Annual income: ₹12 LPA" would otherwise print
 * with a blank box where the symbol should be.
 */
const REPLACEMENTS: [RegExp, string][] = [
  [/₹/g, 'Rs.'],
  [/[‘’‚‛′‵]/g, "'"],
  [/[“”„‟″‶]/g, '"'],
  [/[‐-―]/g, '-'],
  [/…/g, '...'],
  [/[•‣◦]/g, '-'],
  [/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' '],
  [/[\u200B-\u200D\uFEFF]/g, ''],
]

/** Normalise one string for the PDF. Always call this before drawing text. */
export function pdfSafe(value: string): string {
  let out = value
  for (const [re, to] of REPLACEMENTS) out = out.replace(re, to)
  return out
}

/**
 * True when a string still contains characters the base-14 fonts cannot draw
 * after normalisation — in practice, Devanagari and other Indic scripts.
 * The preview screen warns about these rather than dropping them silently.
 */
export function hasUnsupportedScript(value: string): boolean {
  // eslint-disable-next-line no-control-regex -- the low bound is deliberate: this
  // tests which code points fall outside Latin + punctuation + currency.
  return /[^\u0000-\u024F\u2000-\u206F\u20A0-\u20CF]/.test(pdfSafe(value))
}
