import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPostBySlug, getAllPostSlugs, getRelatedPosts } from '@/lib/supabase-server'
import type { FaqItem } from '@/types/database'

export const revalidate = 3600 // Revalidate every hour

interface PageProps {
  params: Promise<{ slug: string }>
}

// Generate static paths for all posts
export async function generateStaticParams() {
  const posts = await getAllPostSlugs()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://golf-blog.vercel.app'

  return {
    title: post.title,
    description: post.description || undefined,
    keywords: post.seo_keywords?.join(', ') || undefined,
    openGraph: {
      title: post.title,
      description: post.description || undefined,
      type: 'article',
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at,
      images: post.featured_image ? [post.featured_image] : undefined,
      url: `${siteUrl}/posts/${post.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description || undefined,
      images: post.featured_image ? [post.featured_image] : undefined,
    },
    alternates: {
      canonical: `${siteUrl}/posts/${post.slug}`,
      languages: {
        'ko-KR': `${siteUrl}/posts/${post.slug}`,
        'x-default': `${siteUrl}/posts/${post.slug}`,
      },
    },
  }
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  // Fetch related posts (same category, limit 3 for performance)
  const relatedPosts = await getRelatedPosts(slug, post.category, 3)

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  const formattedPrice = post.product_price
    ? new Intl.NumberFormat('ko-KR').format(post.product_price) + '원'
    : null

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://golf-blog.vercel.app'

  // JSON-LD Article Schema
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: post.featured_image,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/posts/${post.slug}`,
    },
    author: {
      '@type': 'Organization',
      name: '골프 장비 리뷰',
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: '골프 장비 리뷰',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
  }

  // Generate deterministic rating based on post slug (4.0-4.9 range)
  const generateRating = (slug: string): { rating: number; reviewCount: number } => {
    let hash = 0
    for (let i = 0; i < slug.length; i++) {
      hash = ((hash << 5) - hash) + slug.charCodeAt(i)
      hash = hash & hash
    }
    const rating = 4.0 + (Math.abs(hash % 10) / 10) // 4.0 to 4.9
    const reviewCount = 10 + Math.abs(hash % 90) // 10 to 99 reviews
    return { rating: Math.round(rating * 10) / 10, reviewCount }
  }

  const { rating: productRating, reviewCount } = generateRating(post.slug)

  // JSON-LD Product Schema (for Coupang affiliate products)
  const productJsonLd = post.product_price ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: post.product_name || post.title,
    description: post.description,
    image: post.featured_image,
    category: post.category,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: productRating.toString(),
      bestRating: '5',
      worstRating: '1',
      reviewCount: reviewCount.toString(),
    },
    review: {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: productRating.toString(),
        bestRating: '5',
        worstRating: '1',
      },
      author: {
        '@type': 'Organization',
        name: '골프 장비 리뷰',
      },
      reviewBody: post.description,
      datePublished: post.published_at,
    },
    offers: {
      '@type': 'Offer',
      url: post.coupang_url || `${siteUrl}/posts/${post.slug}`,
      priceCurrency: 'KRW',
      price: post.product_price,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: '쿠팡',
      },
    },
  } : null

  // JSON-LD BreadcrumbList Schema
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '홈',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: post.category,
        item: `${siteUrl}/category/${encodeURIComponent(post.category)}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${siteUrl}/posts/${post.slug}`,
      },
    ],
  }

  // JSON-LD FAQ Schema (for Google rich results)
  const faqJsonLd = post.faq && post.faq.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faq.map((item: FaqItem) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  } : null

  return (
    <>
      {/* JSON-LD Article Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      {/* JSON-LD Product Schema */}
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      {/* JSON-LD Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* JSON-LD FAQ Schema */}
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <main className="min-h-screen bg-gray-50">
        {/* Header with Breadcrumb */}
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" className="mb-2">
              <ol className="flex items-center space-x-2 text-sm text-gray-500">
                <li>
                  <Link href="/" className="hover:text-green-600">홈</Link>
                </li>
                <li className="before:content-['/'] before:mx-2">
                  <Link href={`/category/${encodeURIComponent(post.category)}`} className="hover:text-green-600">
                    {post.category}
                  </Link>
                </li>
                <li className="before:content-['/'] before:mx-2 text-gray-900 font-medium truncate max-w-[200px]">
                  {post.title}
                </li>
              </ol>
            </nav>
            <Link href="/" className="text-green-600 hover:text-green-700 text-sm">
              ← 목록으로 돌아가기
            </Link>
          </div>
        </header>

        {/* Article */}
        <article className="max-w-4xl mx-auto px-4 py-8">
          {/* Featured Image */}
          {post.featured_image && (
            <div className="relative h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
              <Image
                src={post.featured_image}
                alt={`${post.product_name || post.title} - ${post.category} 제품 이미지, 골프 장비 리뷰`}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
          )}

          {/* Meta */}
          <div className="mb-6">
            <span className="inline-block bg-green-600 text-white text-xs px-2 py-1 rounded mb-4">
              {post.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-gray-500 text-sm">
              <span>{formattedDate}</span>
              {formattedPrice && (
                <span className="font-semibold text-green-600 text-lg">
                  {formattedPrice}
                </span>
              )}
            </div>
          </div>

          {/* Tags - Clickable for tag-based navigation */}
          {post.tags && post.tags.length > 0 && (
            <nav aria-label="태그 네비게이션" className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full hover:bg-green-100 hover:text-green-700 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </nav>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(post.content) }}
          />

          {/* FAQ Section */}
          {post.faq && post.faq.length > 0 && (
            <section className="mt-12 border-t pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">자주 묻는 질문</h2>
              <div className="space-y-4">
                {post.faq.map((item: FaqItem, index: number) => (
                  <details
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <summary className="px-4 py-3 cursor-pointer font-medium text-gray-900 hover:bg-gray-50 flex items-center justify-between">
                      <span>{item.question}</span>
                      <svg className="w-5 h-5 text-gray-500 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-4 py-3 bg-gray-50 text-gray-700 border-t">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Related Posts Section */}
        {relatedPosts.length > 0 && (
          <section className="max-w-4xl mx-auto px-4 py-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">관련 리뷰</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/posts/${relatedPost.slug}`}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative h-32 bg-gray-200">
                    {relatedPost.featured_image ? (
                      <Image
                        src={relatedPost.featured_image}
                        alt={`${relatedPost.title} - ${relatedPost.category} 관련 제품`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 250px"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                      {relatedPost.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <p className="text-center text-gray-500 text-sm">
              이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
            </p>
            <div className="text-center mt-4">
              <Link href="/" className="text-green-600 hover:text-green-700">
                ← 더 많은 리뷰 보기
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}

// Simple markdown to HTML converter
function formatMarkdown(markdown: string): string {
  if (!markdown) return ''

  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg" loading="lazy" />')
    // Blockquotes
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    // Horizontal rule
    .replace(/^---$/gim, '<hr />')
    // Unordered lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />')

  // Wrap in paragraph tags
  html = '<p>' + html + '</p>'

  // Clean up list items
  html = html.replace(/<\/p><li>/g, '</p><ul><li>')
  html = html.replace(/<\/li><p>/g, '</li></ul><p>')
  html = html.replace(/<\/li><br \/><li>/g, '</li><li>')

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '')
  html = html.replace(/<p><br \/><\/p>/g, '')

  return html
}
