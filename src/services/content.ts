import type { BlogPost, JobPost, LocationRow, PopularCity } from '@/types/domain'
import { requireSupabase, toServiceError } from './supabase/client'

/** Cities marked popular by the website admin — drives the Home "Browse by city" rail. */
export async function listPopularCities(): Promise<PopularCity[]> {
  try {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('popular_cities')
      .select('id,name')
      .order('name')
    if (error) throw error
    return data as PopularCity[]
  } catch (err) {
    throw toServiceError(err)
  }
}

/**
 * Cities the DB was seeded with under their older names. Without this the
 * bundled list would add a second "Gurugram" next to the admin's "Gurgaon" and
 * a second "Bengaluru" next to "Bangalore", and a couple would have to guess
 * which of the two the vendors are actually filed under.
 */
const CITY_ALIASES: Record<string, string> = {
  gurgaon: 'gurugram',
  bangalore: 'bengaluru',
  bombay: 'mumbai',
  calcutta: 'kolkata',
  madras: 'chennai',
  poona: 'pune',
  mysore: 'mysuru',
  mangalore: 'mangaluru',
  trivandrum: 'thiruvananthapuram',
  allahabad: 'prayagraj',
  baroda: 'vadodara',
  cochin: 'kochi',
  calicut: 'kozhikode',
  pondicherry: 'puducherry',
  gauhati: 'guwahati',
  simla: 'shimla',
  jubbulpore: 'jabalpur',
  arrah: 'ara',
  chhapra: 'chapra',
}

function cityKey(city: string): string {
  const k = city.trim().toLowerCase().replace(/\s+/g, ' ')
  return CITY_ALIASES[k] ?? k
}

/**
 * All serviceable cities (state + city) for the location selector.
 *
 * The `locations` table is admin-curated and, in practice, thin — it was filled
 * in city by city as the marketplace launched, so entire states had no row and
 * therefore could not be selected at all. The bundled all-India list fills the
 * gaps; the table always wins where the two overlap, so the admin's spelling
 * and any city they add later take precedence without touching this code.
 *
 * A failed request falls back to the bundled list rather than an error state:
 * a full city list the vendors may not match is far more useful than none.
 */
export async function listLocations(): Promise<LocationRow[]> {
  const { INDIA_LOCATIONS } = await import('@/data/india-locations')

  let rows: LocationRow[] = []
  try {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('locations')
      .select('id,state,city')
      .order('state')
      .order('city')
    if (error) throw error
    rows = data as LocationRow[]
  } catch (err) {
    // Swallowed on purpose — see the doc comment. Surfaced only if the bundled
    // list is somehow empty too, which would be a build problem, not a network one.
    if (Object.keys(INDIA_LOCATIONS).length === 0) throw toServiceError(err)
  }

  const seen = new Set(rows.map((r) => cityKey(r.city)))
  const merged = [...rows]
  for (const [state, cities] of Object.entries(INDIA_LOCATIONS)) {
    for (const city of cities) {
      const key = cityKey(city)
      if (seen.has(key)) continue
      seen.add(key)
      merged.push({ id: `bundled:${state}:${city}`, state, city })
    }
  }

  return merged.sort((a, b) => a.state.localeCompare(b.state) || a.city.localeCompare(b.city))
}

interface BlogRow {
  id: string
  title: string
  slug: string
  category: string | null
  image: string | null
  excerpt: string | null
  content: string | null
  author: string | null
  created_at: string
}

const mapBlog = (r: BlogRow): BlogPost => ({
  id: r.id,
  title: r.title,
  slug: r.slug,
  category: r.category,
  image: r.image,
  excerpt: r.excerpt,
  content: r.content,
  author: r.author,
  createdAt: r.created_at,
})

/** Wedding-planning articles published from the website admin. */
export async function listBlogs(limit = 20): Promise<BlogPost[]> {
  try {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data as BlogRow[]).map(mapBlog)
  } catch (err) {
    throw toServiceError(err)
  }
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = requireSupabase()
    const { data, error } = await supabase.from('blogs').select('*').eq('slug', slug).maybeSingle()
    if (error) throw error
    return data ? mapBlog(data as BlogRow) : null
  } catch (err) {
    throw toServiceError(err)
  }
}

interface JobRow {
  id: string
  title: string
  type: string | null
  locations: string[] | null
  created_at: string
}

export async function listJobs(): Promise<JobPost[]> {
  try {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as JobRow[]).map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      locations: r.locations ?? [],
      createdAt: r.created_at,
    }))
  } catch (err) {
    throw toServiceError(err)
  }
}
