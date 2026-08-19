import { describe, expect, it } from 'vitest'
import { Buffer } from 'node:buffer'
import { inflateSync } from 'node:zlib'
import { renderToBuffer } from '@react-pdf/renderer'
import { buildDocument } from '../templates'
import { EMPTY_DRAFT, type BiodataDraft, type TemplateId } from '../types'

/**
 * Renders each template to a real PDF and inspects the bytes.
 *
 * The footer assertion is the important one. The branding line is a `fixed`
 * element, which react-pdf repeats per page, and a styling change can drop it
 * from every page of a multi-page document without any error — while the
 * one-page case still renders correctly. Only a render that actually paginates
 * catches that, so `full` and `long` are sized to run past one page.
 */

const TEMPLATES: TemplateId[] = ['classic', 'floral', 'minimal']
const FOOTER = 'Created free at weddingmall.online'

const full: BiodataDraft = {
  ...EMPTY_DRAFT,
  values: {
    ...EMPTY_DRAFT.values,
    fullName: 'Ananya Sharma', dob: '1996-04-12', tob: '06:45', pob: 'Pune, Maharashtra',
    height: '5 ft 4 in', gender: 'Female', maritalStatus: 'Never married', religion: 'Hindu',
    caste: 'Brahmin', subCaste: 'Deshastha', gotra: 'Kashyap', manglik: 'No',
    motherTongue: 'Marathi', bloodGroup: 'B+', nationality: 'Indian',
    qualification: 'M.Tech, Computer Science', college: 'COEP Technological University',
    occupation: 'Senior Software Engineer', company: 'Infosys Ltd', income: 'Rs. 18 LPA',
    workLocation: 'Pune',
    fatherName: 'Suresh Sharma', fatherOccupation: 'Retired Bank Manager',
    motherName: 'Vaishali Sharma', motherOccupation: 'Homemaker',
    siblings: 'One younger brother (studying)', familyType: 'Nuclear',
    familyStatus: 'Upper middle class', nativePlace: 'Kolhapur',
    familyAddress: '12 Shivaji Nagar, Pune 411005',
    diet: 'Vegetarian', smoking: 'No', drinking: 'No',
    hobbies: 'Classical dance, trekking, reading',
    about: 'I am an easy-going person who values family and honesty.',
    partnerPreference: 'Looking for a well-educated, family-oriented partner.',
    contactName: 'Suresh Sharma (Father)', mobile: '9876543210', altMobile: '9822012345',
    email: 'ananya.sharma@example.com', address: '12 Shivaji Nagar, Pune 411005',
  },
}

/** Only the handful of fields a first-time visitor is likely to fill in. */
const sparse: BiodataDraft = {
  ...EMPTY_DRAFT,
  values: {
    ...EMPTY_DRAFT.values,
    fullName: 'Rohit Verma', dob: '1993-11-02', gender: 'Male',
    occupation: 'Teacher', mobile: '9876501234',
  },
}

/** Enough prose to force a third page and to wrap the name onto two lines. */
const long: BiodataDraft = {
  ...full,
  values: {
    ...full.values,
    fullName: 'Lakshmi Priyadarshini Venkataraman Iyer',
    qualification:
      'Doctor of Philosophy in Computational Fluid Dynamics, followed by a post-doctoral fellowship',
    about: 'I am a calm, curious person. '.repeat(30),
    partnerPreference: 'Someone kind, educated and family-oriented. '.repeat(30),
    hobbies: 'Bharatanatyam, long-distance running, watercolour painting, birdwatching, '.repeat(6),
  },
}

interface Inspection {
  pages: number
  /** Visible text of each page, in page order. */
  text: string[]
  a4: boolean
}

/**
 * Pull page text straight out of the PDF.
 *
 * The base-14 fonts are not embedded, so every deflated stream in the file is a
 * page's content stream, and the glyph codes inside its `TJ` arrays are plain
 * WinAnsi. That makes `<hex>` → latin1 an accurate reading of what a person
 * would see, without adding a PDF parser to the dev dependencies.
 */
function inspect(buffer: Buffer): Inspection {
  const raw = buffer.toString('latin1')
  const text: string[] = []

  const marker = /stream\r?\n/g
  let match: RegExpExecArray | null
  while ((match = marker.exec(raw))) {
    const start = match.index + match[0].length
    const end = raw.indexOf('endstream', start)
    if (end < 0) continue
    let content: string
    try {
      content = inflateSync(Buffer.from(raw.slice(start, end), 'latin1')).toString('latin1')
    } catch {
      continue // An image (DCTDecode) or another stream we do not need.
    }
    const glyphs = content.match(/<([0-9a-fA-F]+)>/g) ?? []
    text.push(glyphs.map((g) => Buffer.from(g.slice(1, -1), 'hex').toString('latin1')).join(''))
  }

  return {
    pages: (raw.match(/\/Type\s*\/Page[^s]/g) ?? []).length,
    text,
    // Written at full float precision, e.g. `[0 0 595.280029 841.890015]`.
    a4: /\/MediaBox \[0 0 595\.28\d* 841\.89\d*]/.test(raw),
  }
}

describe('biodata PDF output', () => {
  for (const template of TEMPLATES) {
    it(`${template}: A4, paginates, and brands every page`, async () => {
      const doc = inspect(await renderToBuffer(buildDocument(full, template)))

      expect(doc.a4).toBe(true)
      expect(doc.pages).toBeGreaterThan(1)
      expect(doc.text).toHaveLength(doc.pages)
      for (const page of doc.text) expect(page).toContain(FOOTER)
      // Page numbers appear only once there is more than one page.
      expect(doc.text.some((p) => p.includes(`1 / ${doc.pages}`))).toBe(true)

      expect(doc.text.join('')).toContain('Ananya Sharma')
    }, 30_000)
  }

  it('fits a sparse draft on one page, with no page numbers', async () => {
    const doc = inspect(await renderToBuffer(buildDocument(sparse, 'classic')))

    expect(doc.pages).toBe(1)
    expect(doc.text[0]).toContain(FOOTER)
    expect(doc.text[0]).not.toMatch(/1 \/ 1/)
    // Empty optional fields are dropped rather than printed as blank rows.
    expect(doc.text[0]).not.toContain('Gotra')
  })

  it('carries the footer across a long, multi-page draft', async () => {
    const doc = inspect(await renderToBuffer(buildDocument(long, 'floral')))

    expect(doc.pages).toBeGreaterThan(2)
    for (const page of doc.text) expect(page).toContain(FOOTER)
  }, 30_000)
})
