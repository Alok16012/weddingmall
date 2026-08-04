import { z } from 'zod'

/**
 * Biodata domain model.
 *
 * PORTABILITY: this module imports nothing from the host app — no router, no
 * Supabase, no framework globals. Everything it needs is passed in or lives
 * under `src/modules/biodata`. Dropping the folder into the Next.js app and
 * registering one route is the whole migration.
 *
 * PRIVACY: a biodata contains a person's home address, phone number and photo.
 * None of it is ever sent anywhere — the draft lives in `localStorage` and the
 * PDF is generated in the browser. There is no network call in this module.
 */

export type SectionId = 'personal' | 'career' | 'family' | 'lifestyle' | 'contact'

export type FieldType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'time'
  | 'select'
  | 'tel'
  | 'email'

export interface FieldDef {
  key: FieldKey
  label: string
  section: SectionId
  type: FieldType
  required?: boolean
  /** Options for `select`. */
  options?: readonly string[]
  placeholder?: string
  /** Shown under the input. */
  hint?: string
  /** Derived fields (age) are displayed but never typed into. */
  computed?: boolean
}

export interface SectionDef {
  id: SectionId
  title: string
  /** One line of guidance at the top of the step. */
  blurb: string
}

export const SECTIONS: readonly SectionDef[] = [
  {
    id: 'personal',
    title: 'Personal Details',
    blurb: 'The basics families look at first. Only name, date of birth and gender are required.',
  },
  {
    id: 'career',
    title: 'Education & Career',
    blurb: 'Your qualification and work. Leave income blank if you would rather not share it.',
  },
  { id: 'family', title: 'Family Details', blurb: 'Parents, siblings and your native place.' },
  {
    id: 'lifestyle',
    title: 'Lifestyle & About',
    blurb: 'Habits, interests and a few lines in your own words.',
  },
  {
    id: 'contact',
    title: 'Contact Details',
    blurb: 'How families should reach you. A mobile number is required.',
  },
] as const

/** Heights from 4'0" to 6'11", with the centimetre equivalent families expect. */
function heightOptions(): string[] {
  const out: string[] = []
  for (let inches = 48; inches <= 83; inches++) {
    const ft = Math.floor(inches / 12)
    const inch = inches % 12
    out.push(`${ft}' ${inch}" (${Math.round(inches * 2.54)} cm)`)
  }
  return out
}

export const HEIGHTS = heightOptions()

const YES_NO = ['Yes', 'No', "Don't know"] as const
const BLOOD = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const

/**
 * The single field registry. The form, the hide-field toggles and all three
 * PDF templates iterate this same list, so a field can never appear in one
 * place and be missing from another.
 */
export const FIELDS: readonly FieldDef[] = [
  // ---- Personal ----
  { key: 'fullName', label: 'Full name', section: 'personal', type: 'text', required: true, placeholder: 'e.g. Ananya Sharma' },
  { key: 'dob', label: 'Date of birth', section: 'personal', type: 'date', required: true },
  { key: 'age', label: 'Age', section: 'personal', type: 'text', computed: true, hint: 'Calculated from your date of birth' },
  { key: 'tob', label: 'Time of birth', section: 'personal', type: 'time', hint: 'Used for horoscope matching' },
  { key: 'pob', label: 'Place of birth', section: 'personal', type: 'text', placeholder: 'City, State' },
  { key: 'height', label: 'Height', section: 'personal', type: 'select', options: HEIGHTS },
  { key: 'gender', label: 'Gender', section: 'personal', type: 'select', required: true, options: ['Male', 'Female'] },
  { key: 'maritalStatus', label: 'Marital status', section: 'personal', type: 'select', options: ['Never married', 'Divorced', 'Widowed', 'Awaiting divorce'] },
  { key: 'religion', label: 'Religion', section: 'personal', type: 'select', options: ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Parsi', 'Jewish', 'Other'] },
  { key: 'caste', label: 'Community / Caste', section: 'personal', type: 'text' },
  { key: 'subCaste', label: 'Sub-caste', section: 'personal', type: 'text' },
  { key: 'gotra', label: 'Gotra', section: 'personal', type: 'text' },
  { key: 'manglik', label: 'Manglik', section: 'personal', type: 'select', options: YES_NO },
  { key: 'motherTongue', label: 'Mother tongue', section: 'personal', type: 'text', placeholder: 'e.g. Hindi' },
  { key: 'bloodGroup', label: 'Blood group', section: 'personal', type: 'select', options: BLOOD },
  { key: 'nationality', label: 'Nationality', section: 'personal', type: 'text', placeholder: 'Indian' },

  // ---- Education & Career ----
  { key: 'qualification', label: 'Highest qualification', section: 'career', type: 'text', placeholder: 'e.g. B.Tech, Computer Science' },
  { key: 'college', label: 'College / University', section: 'career', type: 'text' },
  { key: 'occupation', label: 'Occupation', section: 'career', type: 'text', placeholder: 'e.g. Software Engineer' },
  { key: 'company', label: 'Company / Business', section: 'career', type: 'text' },
  { key: 'income', label: 'Annual income', section: 'career', type: 'text', placeholder: 'e.g. ₹12 LPA' },
  { key: 'workLocation', label: 'Work location', section: 'career', type: 'text', placeholder: 'City, Country' },

  // ---- Family ----
  { key: 'fatherName', label: "Father's name", section: 'family', type: 'text' },
  { key: 'fatherOccupation', label: "Father's occupation", section: 'family', type: 'text' },
  { key: 'motherName', label: "Mother's name", section: 'family', type: 'text' },
  { key: 'motherOccupation', label: "Mother's occupation", section: 'family', type: 'text' },
  { key: 'siblings', label: 'Siblings', section: 'family', type: 'text', placeholder: 'e.g. 1 elder brother (married)' },
  { key: 'familyType', label: 'Family type', section: 'family', type: 'select', options: ['Nuclear', 'Joint'] },
  { key: 'familyStatus', label: 'Family status', section: 'family', type: 'select', options: ['Middle class', 'Upper middle class', 'Affluent'] },
  { key: 'nativePlace', label: 'Native place', section: 'family', type: 'text' },
  { key: 'familyAddress', label: 'Family address', section: 'family', type: 'textarea' },

  // ---- Lifestyle ----
  { key: 'diet', label: 'Diet', section: 'lifestyle', type: 'select', options: ['Vegetarian', 'Non-vegetarian', 'Eggetarian', 'Jain', 'Vegan'] },
  { key: 'smoking', label: 'Smoking', section: 'lifestyle', type: 'select', options: ['No', 'Occasionally', 'Yes'] },
  { key: 'drinking', label: 'Drinking', section: 'lifestyle', type: 'select', options: ['No', 'Occasionally', 'Yes'] },
  { key: 'hobbies', label: 'Hobbies & interests', section: 'lifestyle', type: 'textarea', placeholder: 'Reading, classical music, badminton…' },
  { key: 'about', label: 'About me', section: 'lifestyle', type: 'textarea', placeholder: 'A few lines about yourself' },
  { key: 'partnerPreference', label: 'Partner preferences', section: 'lifestyle', type: 'textarea', placeholder: 'What you are looking for in a partner' },

  // ---- Contact ----
  { key: 'contactName', label: 'Contact person', section: 'contact', type: 'text', placeholder: 'e.g. Rajesh Sharma (Father)' },
  { key: 'mobile', label: 'Mobile number', section: 'contact', type: 'tel', required: true, placeholder: '98765 43210' },
  { key: 'altMobile', label: 'Alternative number', section: 'contact', type: 'tel' },
  { key: 'email', label: 'Email address', section: 'contact', type: 'email', placeholder: 'you@example.com' },
  { key: 'address', label: 'Current address', section: 'contact', type: 'textarea' },
] as const

/**
 * Trim, collapse runs of whitespace, and strip dangerous characters.
 *
 * Newlines survive (textareas need them), but C0/C1 control codes and the
 * Unicode bidi overrides are removed — those are the characters that let
 * pasted text reorder or conceal itself once it is drawn into the PDF.
 */
function clean(v: unknown): string {
  if (typeof v !== 'string') return ''
  // eslint-disable-next-line no-control-regex -- stripping control codes is the point.
  return v
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .replace(/[\u202A-\u202E\u2066-\u2069\u200E\u200F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Every free-text value goes through the same sanitiser. */
const text = (max = 120) => z.preprocess(clean, z.string().max(max))
const longText = (max = 900) => z.preprocess(clean, z.string().max(max))

/** Indian mobile: 10 digits starting 6–9, tolerating +91 / 0 / spaces / dashes. */
const MOBILE_RE = /^(?:\+?91[-\s]?|0)?[6-9]\d{9}$/

export const mobileSchema = z.preprocess(
  (v) => clean(v).replace(/[\s-]/g, ''),
  z.string().refine((v) => v === '' || MOBILE_RE.test(v), 'Enter a valid 10-digit Indian mobile number'),
)

export const emailSchema = z.preprocess(
  (v) => clean(v).toLowerCase(),
  z.string().refine((v) => v === '' || z.string().email().safeParse(v).success, 'Enter a valid email address'),
)

/** A date that is a real past date and gives a plausible marrying age. */
export const dobSchema = z.preprocess(
  clean,
  z.string().refine((v) => {
    if (v === '') return true
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return false
    const age = ageFrom(v)
    return age !== null && age >= 18 && age <= 100
  }, 'Enter a valid date of birth (age must be between 18 and 100)'),
)

export const biodataSchema = z.object({
  // Personal
  fullName: z.preprocess(clean, z.string().min(2, 'Please enter your full name').max(80)),
  dob: dobSchema,
  tob: text(20),
  pob: text(),
  height: text(40),
  gender: z.preprocess(clean, z.string().min(1, 'Please select a gender')),
  maritalStatus: text(40),
  religion: text(40),
  caste: text(60),
  subCaste: text(60),
  gotra: text(60),
  manglik: text(20),
  motherTongue: text(40),
  bloodGroup: text(10),
  nationality: text(40),

  // Education & career
  qualification: text(160),
  college: text(160),
  occupation: text(120),
  company: text(160),
  income: text(60),
  workLocation: text(120),

  // Family
  fatherName: text(80),
  fatherOccupation: text(120),
  motherName: text(80),
  motherOccupation: text(120),
  siblings: longText(300),
  familyType: text(40),
  familyStatus: text(40),
  nativePlace: text(120),
  familyAddress: longText(300),

  // Lifestyle
  diet: text(40),
  smoking: text(20),
  drinking: text(20),
  hobbies: longText(400),
  about: longText(900),
  partnerPreference: longText(900),

  // Contact
  contactName: text(80),
  mobile: mobileSchema,
  altMobile: mobileSchema,
  email: emailSchema,
  address: longText(300),
})

export type BiodataValues = z.infer<typeof biodataSchema>

/** Keys the user actually types into and that get persisted. */
export type ValueKey = keyof BiodataValues

/**
 * Every key the form and the templates address. `age` is derived from the date
 * of birth rather than stored, but it is still a field you can see and hide —
 * so it belongs in the registry even though it is not in the schema.
 */
export type FieldKey = ValueKey | 'age'

export type TemplateId = 'classic' | 'floral' | 'minimal'

export interface BiodataDraft {
  values: BiodataValues
  /** Keys the user has chosen NOT to print. */
  hidden: FieldKey[]
  /** Cropped, re-encoded JPEG data URL. Never uploaded. */
  photo: string | null
  template: TemplateId
  /** Highest step reached, so returning users resume where they left off. */
  step: number
}

export const EMPTY_VALUES: BiodataValues = Object.fromEntries(
  FIELDS.filter((f) => !f.computed).map((f) => [f.key, '']),
) as BiodataValues

export const EMPTY_DRAFT: BiodataDraft = {
  values: { ...EMPTY_VALUES, nationality: 'Indian' },
  hidden: [],
  photo: null,
  template: 'classic',
  step: 0,
}

/** Whole years between `dob` and today, or null if the date is unusable. */
export function ageFrom(dob: string): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  if (d > now) return null
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

/** `1998-04-17` → `17 April 1998`, the form families read on a biodata. */
export function formatDob(dob: string): string {
  if (!dob) return ''
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return dob
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** `14:30` → `2:30 PM`. */
export function formatTob(tob: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(tob.trim())
  if (!m) return tob
  const h = Number(m[1])
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${m[2]} ${suffix}`
}

/** Group the registry by section, preserving declaration order. */
export function fieldsOf(section: SectionId): FieldDef[] {
  return FIELDS.filter((f) => f.section === section)
}

/**
 * The rows a template should print for one section: visible, non-empty, with
 * display formatting already applied. Templates never touch raw values, so all
 * three stay consistent and none of them can leak a hidden field.
 */
export interface PrintRow {
  key: FieldKey
  label: string
  value: string
  /** Long prose renders as a paragraph rather than a label/value row. */
  block: boolean
}

export function printRows(draft: BiodataDraft, section: SectionId): PrintRow[] {
  const hidden = new Set(draft.hidden)
  const rows: PrintRow[] = []

  for (const f of fieldsOf(section)) {
    if (hidden.has(f.key)) continue

    let value: string
    if (f.key === 'age') {
      const age = ageFrom(draft.values.dob)
      value = age === null ? '' : `${age} years`
    } else if (f.key === 'dob') {
      value = formatDob(draft.values.dob)
    } else if (f.key === 'tob') {
      value = formatTob(draft.values.tob)
    } else {
      value = draft.values[f.key] ?? ''
    }

    if (!value) continue
    rows.push({ key: f.key, label: f.label, value, block: f.type === 'textarea' })
  }

  return rows
}

/** Sections that have at least one printable row — used to skip empty blocks. */
export function printableSections(draft: BiodataDraft): { section: SectionDef; rows: PrintRow[] }[] {
  return SECTIONS.map((section) => ({ section, rows: printRows(draft, section.id) })).filter(
    (s) => s.rows.length > 0,
  )
}
