import type { ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import { Classic } from './Classic'
import { Floral } from './Floral'
import { Minimal } from './Minimal'
import { buildTemplateProps } from './props'
import type { BiodataDraft } from '../types'

/**
 * The renderer-bound half of the template layer.
 *
 * Importing this file pulls in `@react-pdf/renderer`, so it is reached only
 * through the dynamic import in `pdf.ts`. Anything a screen needs eagerly —
 * the catalogue, the props transform — lives in `./props`, which is free of
 * renderer imports.
 */

const COMPONENTS = { classic: Classic, floral: Floral, minimal: Minimal } as const

/** Build the react-pdf document for a draft's selected template. */
export function buildDocument(
  draft: BiodataDraft,
  template = draft.template,
): ReactElement<DocumentProps> {
  const Component = COMPONENTS[template] ?? Classic
  return <Component {...buildTemplateProps(draft)} />
}

export { Classic, Floral, Minimal }
