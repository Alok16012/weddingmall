import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { BRAND, Footer, KEEP_WITH_NEXT, Row, pdfSafe, type TemplateProps } from './shared'

/**
 * Modern Minimal — grotesque type, a single coral rule as the only ornament,
 * and a lot of white space. Section titles are small and letter-spaced rather
 * than boxed, so the page reads as a well-set document instead of a form.
 */

const FONT = 'Helvetica'
const LABEL_W = 138

const s = StyleSheet.create({
  page: {
    fontFamily: FONT,
    fontSize: 9,
    color: BRAND.ink,
    paddingTop: 46,
    paddingHorizontal: 48,
    paddingBottom: 54,
  },
  /** Full-bleed accent rail down the left trim, repeated per page. */
  rail: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 5, backgroundColor: BRAND.primary },
  header: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  photo: {
    width: 92,
    height: 92,
    objectFit: 'cover',
    marginRight: 18,
  },
  eyebrow: { fontSize: 7, letterSpacing: 2.6, color: BRAND.primary, marginBottom: 6 },
  name: { fontSize: 22, fontWeight: 'bold', color: BRAND.ink, lineHeight: 1.15 },
  headline: { fontSize: 9, color: BRAND.muted, marginTop: 5 },
  rule: { height: 2, width: 44, backgroundColor: BRAND.primary, marginTop: 14, marginBottom: 20 },
  sectionTitle: {
    fontSize: 7.5,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: BRAND.primary,
    marginBottom: 9,
  },
  section: { marginBottom: 18 },
  divider: { height: 0.5, backgroundColor: BRAND.lineSoft, marginBottom: 5 },
  label: { color: BRAND.muted },
  value: { color: BRAND.ink, fontWeight: 'bold' },
})

export function Minimal({ sections, name, headline, photo }: TemplateProps) {
  return (
    <Document title={`${name} — Matrimonial Biodata`} author="Wedding Mall">
      <Page size="A4" style={s.page}>
        <View style={s.rail} fixed />

        <View style={s.header}>
          {photo ? <Image style={s.photo} src={photo} /> : null}
          <View style={{ flex: 1 }}>
            <Text style={s.eyebrow}>MATRIMONIAL BIODATA</Text>
            <Text style={s.name}>{pdfSafe(name)}</Text>
            {headline ? <Text style={s.headline}>{pdfSafe(headline)}</Text> : null}
          </View>
        </View>

        <View style={s.rule} />

        {sections.map((section) => (
          <View key={section.title} style={s.section}>
            <View {...KEEP_WITH_NEXT}>
              <Text style={s.sectionTitle}>{pdfSafe(section.title).toUpperCase()}</Text>
              <View style={s.divider} />
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

        <Footer font={FONT} />
      </Page>
    </Document>
  )
}
