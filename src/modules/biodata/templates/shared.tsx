import { Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import type { PrintRow } from '../types'

/**
 * Shared PDF primitives for the three biodata templates.
 *
 * FONTS — we deliberately use the PDF base-14 fonts (Helvetica / Times-Roman)
 * rather than registering the brand webfont. Base-14 fonts are built into every
 * PDF viewer, so: nothing is downloaded at generation time (works offline and
 * inside the Android WebView), the lazy chunk stays small, and the output can
 * never render as empty boxes because a font fetch failed on a slow connection.
 * The trade-off is WinAnsi encoding — see `pdfSafe` below.
 */

/** A4 at 72 dpi, the unit react-pdf lays out in. */
export const A4 = { width: 595.28, height: 841.89 }

export const BRAND = {
  primary: '#ff5a52',
  primaryDark: '#c8392f',
  accent: '#ff9b2f',
  ink: '#19191d',
  inkSoft: '#46464e',
  muted: '#63636b',
  line: '#e4d9d3',
  lineSoft: '#f0e8e3',
  blush: '#fdf6f4',
  cream: '#fbf7f2',
  gold: '#a8843c',
}

// Re-exported so a template file has one import for everything it draws with.
export { pdfSafe, hasUnsupportedScript } from './text'
export type { TemplateSection, TemplateProps } from './props'
import { pdfSafe } from './text'

/**
 * Line height for multi-line prose (About me, partner preferences).
 *
 * Applied only to those blocks, never to a `Page` style: a page-wide leading
 * loosens every single-line label/value row too, which pushed a filled-in
 * biodata from two pages to three for no gain in readability. Rows read fine on
 * the font's own leading.
 */
export const LINE = 1.5

export const base = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 5 },
  label: { color: BRAND.muted },
  value: { color: BRAND.ink },
})

/**
 * One label/value line.
 *
 * `wrap={false}` keeps a label and its value on the same page; long values
 * still wrap internally, because only the outer row is atomic.
 */
export function Row({
  row,
  labelWidth,
  style,
  labelStyle,
  valueStyle,
}: {
  row: PrintRow
  labelWidth: number
  style?: Style
  labelStyle?: Style
  valueStyle?: Style
}) {
  if (row.block) {
    return (
      <View style={{ marginBottom: 8 }}>
        <Text style={{ ...base.label, ...labelStyle, marginBottom: 2.5 }}>{pdfSafe(row.label)}</Text>
        <Text style={{ ...base.value, ...valueStyle, lineHeight: LINE }}>{pdfSafe(row.value)}</Text>
      </View>
    )
  }
  return (
    <View style={{ ...base.row, ...style }} wrap={false}>
      <Text style={{ ...base.label, ...labelStyle, width: labelWidth }}>{pdfSafe(row.label)}</Text>
      <Text style={{ ...base.value, ...valueStyle, flex: 1 }}>{pdfSafe(row.value)}</Text>
    </View>
  )
}

/**
 * Footer repeated on every page. Page numbers only appear once the biodata
 * actually runs to more than one page.
 *
 * `fixed` elements are repeated by react-pdf per page rather than laid out once,
 * and they fail silently: a style change can drop this from every page of a
 * multi-page document while the single-page case still renders correctly, so it
 * reads as a pagination bug. `pdf-output.test.ts` renders a two- and a
 * three-page biodata and asserts the branding survives on each page — keep that
 * test passing when touching anything here.
 */
export function Footer({ font, colour = BRAND.muted }: { font: string; colour?: string }) {
  const text = { fontFamily: font, fontSize: 7.5, color: colour }
  return (
    <View
      fixed
      style={{
        position: 'absolute',
        bottom: 24,
        left: 42,
        right: 42,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Text style={{ ...text, letterSpacing: 0.4 }}>Created free at WeddingMall.Online</Text>
      <Text
        style={text}
        render={({ pageNumber, totalPages }) => (totalPages > 1 ? `${pageNumber} / ${totalPages}` : '')}
      />
    </View>
  )
}

/**
 * Stops a section heading being stranded at the foot of a page: react-pdf
 * pushes the whole group over unless ~64pt of room remains beneath it.
 */
export const KEEP_WITH_NEXT = { minPresenceAhead: 64 }
