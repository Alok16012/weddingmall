import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { BRAND, Footer, KEEP_WITH_NEXT, Row, pdfSafe, type TemplateProps } from './shared'

/**
 * Elegant Floral — a softer, more ceremonial treatment: blush page, a thin
 * gold keyline inset from the trim, the photograph centred beneath the name.
 *
 * The "floral" cue is a small geometric rosette drawn from plain rectangles
 * rather than clip-art. Real illustration would either look stock or, if
 * generated, look obviously synthetic — a restrained mark reads as designed.
 */

const FONT = 'Times-Roman'
const LABEL_W = 128

const s = StyleSheet.create({
  page: {
    fontFamily: FONT,
    fontSize: 9.5,
    color: BRAND.ink,
    backgroundColor: BRAND.blush,
    paddingTop: 44,
    paddingHorizontal: 52,
    paddingBottom: 54,
  },
  /** Keyline frame, repeated on every page. */
  frame: {
    position: 'absolute',
    top: 22,
    left: 24,
    right: 24,
    bottom: 22,
    borderWidth: 0.8,
    borderColor: BRAND.gold,
  },
  frameInner: {
    position: 'absolute',
    top: 26,
    left: 28,
    right: 28,
    bottom: 26,
    borderWidth: 0.4,
    borderColor: BRAND.gold,
  },
  head: { alignItems: 'center', marginBottom: 14 },
  eyebrow: { fontSize: 7.5, letterSpacing: 2.4, color: BRAND.gold, marginBottom: 6 },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BRAND.primaryDark,
    textAlign: 'center',
    lineHeight: 1.25,
  },
  headline: { fontSize: 9.5, color: BRAND.inkSoft, marginTop: 4, textAlign: 'center' },
  photo: {
    width: 104,
    height: 138,
    objectFit: 'cover',
    borderWidth: 2,
    borderColor: '#ffffff',
    marginTop: 12,
  },
  /** Rosette: a rotated square between two short rules. */
  ornament: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  ornamentRule: { width: 54, height: 0.6, backgroundColor: BRAND.gold },
  ornamentDot: {
    width: 4.5,
    height: 4.5,
    backgroundColor: BRAND.gold,
    marginHorizontal: 6,
    transform: 'rotate(45deg)',
  },
  sectionHead: { alignItems: 'center', marginBottom: 10 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.6,
    color: BRAND.primaryDark,
  },
  sectionRule: { width: 34, height: 0.7, backgroundColor: BRAND.gold, marginTop: 4 },
  section: { marginBottom: 16 },
  label: { color: '#8b7a70' },
  value: { color: BRAND.ink },
})

function Ornament() {
  return (
    <View style={s.ornament}>
      <View style={s.ornamentRule} />
      <View style={s.ornamentDot} />
      <View style={s.ornamentRule} />
    </View>
  )
}

export function Floral({ sections, name, headline, photo }: TemplateProps) {
  return (
    <Document title={`${name} — Matrimonial Biodata`} author="WeddingMall.Online">
      <Page size="A4" style={s.page}>
        <View style={s.frame} fixed />
        <View style={s.frameInner} fixed />

        <View style={s.head}>
          <Text style={s.eyebrow}>MATRIMONIAL BIODATA</Text>
          <Text style={s.name}>{pdfSafe(name)}</Text>
          {headline ? <Text style={s.headline}>{pdfSafe(headline)}</Text> : null}
          {photo ? <Image style={s.photo} src={photo} /> : null}
          <Ornament />
        </View>

        {sections.map((section) => (
          <View key={section.title} style={s.section}>
            <View style={s.sectionHead} {...KEEP_WITH_NEXT}>
              <Text style={s.sectionTitle}>{pdfSafe(section.title).toUpperCase()}</Text>
              <View style={s.sectionRule} />
            </View>
            {section.rows.map((row) => (
              <Row
                key={row.label}
                row={row}
                labelWidth={LABEL_W}
                labelStyle={s.label}
                valueStyle={s.value}
              />
            ))}
          </View>
        ))}

        <Footer font={FONT} colour={BRAND.gold} />
      </Page>
    </Document>
  )
}
