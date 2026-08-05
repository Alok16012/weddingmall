import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { BRAND, Footer, KEEP_WITH_NEXT, Row, pdfSafe, type TemplateProps } from './shared'

/**
 * Classic Traditional — the layout Indian families expect: a formal serif
 * setting, the name centred under a double rule, photo top-right, and each
 * section introduced by a tinted band. Decoration is limited to rules and
 * bands, so it prints cleanly in black and white too.
 */

const FONT = 'Times-Roman'
const LABEL_W = 132

const s = StyleSheet.create({
  page: {
    fontFamily: FONT,
    fontSize: 9.5,
    color: BRAND.ink,
    paddingTop: 38,
    paddingHorizontal: 42,
    paddingBottom: 52,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  eyebrow: {
    fontSize: 7.5,
    letterSpacing: 2.2,
    color: BRAND.muted,
    marginBottom: 5,
  },
  name: { fontSize: 21, fontWeight: 'bold', color: BRAND.primaryDark, lineHeight: 1.2 },
  headline: { fontSize: 9.5, color: BRAND.inkSoft, marginTop: 4 },
  photo: {
    width: 96,
    height: 128,
    objectFit: 'cover',
    borderWidth: 1,
    borderColor: BRAND.line,
    marginLeft: 18,
  },
  ruleThick: { height: 1.6, backgroundColor: BRAND.primaryDark, marginTop: 10 },
  ruleThin: { height: 0.5, backgroundColor: BRAND.primaryDark, marginTop: 2, marginBottom: 16 },
  band: {
    backgroundColor: BRAND.cream,
    borderLeftWidth: 2.5,
    borderLeftColor: BRAND.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 9,
  },
  bandText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.3,
    color: BRAND.primaryDark,
  },
  section: { marginBottom: 15 },
  label: { color: BRAND.muted },
  value: { color: BRAND.ink },
})

export function Classic({ sections, name, headline, photo }: TemplateProps) {
  const title = (
    <View style={{ flex: 1 }}>
      <Text style={s.eyebrow}>MATRIMONIAL BIODATA</Text>
      <Text style={s.name}>{pdfSafe(name)}</Text>
      {headline ? <Text style={s.headline}>{pdfSafe(headline)}</Text> : null}
    </View>
  )

  return (
    <Document title={`${name} — Matrimonial Biodata`} author="WeddingMall.online">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          {title}
          {photo ? <Image style={s.photo} src={photo} /> : null}
        </View>

        <View style={s.ruleThick} />
        <View style={s.ruleThin} />

        {sections.map((section) => (
          <View key={section.title} style={s.section}>
            <View style={s.band} {...KEEP_WITH_NEXT}>
              <Text style={s.bandText}>{pdfSafe(section.title).toUpperCase()}</Text>
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
