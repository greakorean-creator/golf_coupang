import { createClient } from '@supabase/supabase-js'
import type { Database, Post } from '@/types/database'

// Post list type for listing pages
type PostListItem = Pick<Post, 'id' | 'slug' | 'title' | 'description' | 'featured_image' | 'category' | 'tags' | 'published_at' | 'product_price'>

// Server-side Supabase client (for use in Server Components)
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Fetch published posts
export async function getPublishedPosts(limit?: number): Promise<PostListItem[]> {
  const supabase = createServerSupabaseClient()

  let query = supabase
    .from('posts')
    .select('id, slug, title, description, featured_image, category, tags, published_at, product_price')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }

  return data || []
}

// Fetch single post by slug
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error) {
    console.error('Error fetching post:', error)
    return null
  }

  return data
}

// Fetch posts by category
export async function getPostsByCategory(category: string, limit?: number): Promise<PostListItem[]> {
  const supabase = createServerSupabaseClient()

  let query = supabase
    .from('posts')
    .select('id, slug, title, description, featured_image, category, tags, published_at, product_price')
    .eq('is_published', true)
    .eq('category', category)
    .order('published_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching posts by category:', error)
    return []
  }

  return data || []
}

// Get all categories with post count
export async function getCategories(): Promise<{ name: string; count: number }[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('posts')
    .select('category')
    .eq('is_published', true)

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  // Count posts per category
  const categoryCounts: Record<string, number> = {}
  const posts = (data || []) as { category: string }[]
  posts.forEach((post) => {
    const cat = post.category || 'golf'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  })

  return Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    count,
  }))
}

// Get all post slugs (for sitemap)
export async function getAllPostSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('posts')
    .select('slug, updated_at')
    .eq('is_published', true)

  if (error) {
    console.error('Error fetching slugs:', error)
    return []
  }

  return data || []
}

// Related post type (minimal fields for performance)
type RelatedPostItem = Pick<Post, 'id' | 'slug' | 'title' | 'featured_image' | 'category'>

// Get related posts (same category, excluding current post)
export async function getRelatedPosts(
  currentSlug: string,
  category: string,
  limit: number = 3
): Promise<RelatedPostItem[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, title, featured_image, category')
    .eq('is_published', true)
    .eq('category', category)
    .neq('slug', currentSlug)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching related posts:', error)
    return []
  }

  return (data || []) as RelatedPostItem[]
}

// Increment view count (optional - requires RPC function in Supabase)
// export async function incrementViewCount(postId: string) {
//   const supabase = createServerSupabaseClient()
//   await supabase.rpc('increment_view_count', { post_id: postId })
// }
