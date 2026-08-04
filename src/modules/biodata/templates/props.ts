import { ageFrom, printableSections, type BiodataDraft, type PrintRow, type TemplateId } from '../types'
import { hasUnsupportedScript } from './text'

/**
 * Everything about the templates that is *not* a react-pdf component: the
 * catalogue the picker renders, and the draft-to-props transform.
 *
 * This file has no renderer import, so the intro and preview screens can show
 * the design list and warn about unsupported characters without dragging the
 * PDF engine into the main bundle.
 */

export interface TemplateSection {
  title: string
  rows: PrintRow[]
}

export interface TemplateProps {
  sections: TemplateSection[]
  name: string
  headline: string
  photo: string | null
}

export interface TemplateMeta {
  id: TemplateId
  name: string
  description: string
  /** Two swatches used to preview the template before it is rendered. */
  swatch: [string, string]
}

export const TEMPLATES: readonly TemplateMeta[] = [
  {
    id: 'classic',
    name: 'Classic Traditional',
    description: 'Formal serif setting with tinted section bands. Prints well in black and white.',
    swatch: ['#c8392f', '#fbf7f2'],
  },
  {
    id: 'floral',
    name: 'Elegant Floral',
    description: 'Blush page with a fine gold keyline and a centred photograph.',
    swatch: ['#a8843c', '#fdf6f4'],
  },
  {
    id: 'minimal',
    name: 'Modern Minimal',
    description: 'Clean grotesque type, generous spacing, a single coral accent.',
    swatch: ['#ff5a52', '#ffffff'],
  },
] as const

/**
 * A one-line summary under the name: the facts a family scans for first.
 * Anything the user left blank or hid simply drops out.
 */
function buildHeadline(draft: BiodataDraft): string {
  const hidden = new Set(draft.hidden)
  const v = draft.values
  const age = ageFrom(v.dob)

  const parts = [
    !hidden.has('age') && age !== null ? `${age} years` : '',
    !hidden.has('height') ? v.height : '',
    !hidden.has('occupation') ? v.occupation : '',
    !hidden.has('workLocation') ? v.workLocation : '',
  ].filter(Boolean)

  return parts.join('  ·  ')
}

/**
 * Turn a draft into the props every template consumes.
 *
 * The name is drawn as the page title, so it is removed from the Personal
 * rows — otherwise it would print twice. Sections with nothing left to show
 * are dropped entirely, which is what makes a half-filled biodata still look
 * deliberate rather than broken.
 */
export function buildTemplateProps(draft: BiodataDraft): TemplateProps {
  const sections: TemplateSection[] = printableSections(draft)
    .map(({ section, rows }) => ({
      title: section.title,
      rows: rows.filter((r) => r.key !== 'fullName'),
    }))
    .filter((s) => s.rows.length > 0)

  return {
    sections,
    name: draft.values.fullName || 'Your Name',
    headline: buildHeadline(draft),
    photo: draft.photo,
  }
}

/**
 * Every value that will be drawn but cannot be rendered by the base-14 fonts.
 * The preview surfaces these so a user typing in Devanagari is told, rather
 * than downloading a PDF full of blanks.
 */
export function unsupportedValues(draft: BiodataDraft): string[] {
  const { sections, name } = buildTemplateProps(draft)
  const out: string[] = []
  if (hasUnsupportedScript(name)) out.push(name)
  for (const section of sections) {
    for (const row of section.rows) {
      if (hasUnsupportedScript(row.value)) out.push(row.value)
    }
  }
  return out
}
