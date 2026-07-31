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

/** All serviceable cities (state + city) for the location selector. */
export async function listLocations(): Promise<LocationRow[]> {
  try {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('locations')
      .select('id,state,city')
      .order('state')
      .order('city')
    if (error) throw error
    return data as LocationRow[]
  } catch (err) {
    throw toServiceError(err)
  }
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
