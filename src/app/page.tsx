import Link from 'next/link'
import Image from 'next/image'
import { getPaginatedPosts, getCategories } from '@/lib/supabase-server'

export const revalidate = 3600 // Revalidate every hour

interface HomePageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { page } = await searchParams
  const currentPage = Math.max(1, parseInt(page || '1', 10))
  const { posts, totalCount, totalPages } = await getPaginatedPosts(currentPage, 9)
  const categories = await getCategories()

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                <Link href="/">골프 장비 리뷰</Link>
              </h1>
              <p className="text-gray-600 mt-1">
                드라이버, 아이언, 퍼터 등 골프 장비 리뷰와 추천
              </p>
            </div>

            {/* Search Form */}
            <form action="/search" method="GET" className="flex gap-2">
              <input
                type="text"
                name="q"
                placeholder="검색..."
                className="w-48 md:w-64 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                aria-label="검색"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>

          {/* Category Tags */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <Link
                href="/"
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  currentPage === 1 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                전체 ({totalCount})
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={`/category/${encodeURIComponent(cat.name)}`}
                  className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  {cat.name} ({cat.count})
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">아직 게시된 글이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="mt-8 flex justify-center" aria-label="Pagination">
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  {currentPage > 1 ? (
                    <Link
                      href={`/?page=${currentPage - 1}`}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      이전
                    </Link>
                  ) : (
                    <span className="px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed">
                      이전
                    </span>
                  )}

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {generatePageNumbers(currentPage, totalPages).map((pageNum, idx) => (
                      pageNum === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
                      ) : (
                        <Link
                          key={pageNum}
                          href={`/?page=${pageNum}`}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                            pageNum === currentPage
                              ? 'bg-green-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </Link>
                      )
                    ))}
                  </div>

                  {/* Next Button */}
                  {currentPage < totalPages ? (
                    <Link
                      href={`/?page=${currentPage + 1}`}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      다음
                    </Link>
                  ) : (
                    <span className="px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed">
                      다음
                    </span>
                  )}
                </div>
              </nav>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <p className="text-center text-gray-500 text-sm">
            이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
          </p>
          <p className="text-center text-gray-400 text-xs mt-2">
            © {new Date().getFullYear()} 골프 장비 리뷰. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  )
}

// Generate page numbers with ellipsis
function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | string)[] = []

  if (current <= 3) {
    pages.push(1, 2, 3, 4, '...', total)
  } else if (current >= total - 2) {
    pages.push(1, '...', total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total)
  }

  return pages
}

interface PostCardProps {
  post: {
    id: string
    slug: string
    title: string
    description: string | null
    featured_image: string | null
    category: string
    tags: string[] | null
    published_at: string | null
    product_price: number | null
  }
}

function PostCard({ post }: PostCardProps) {
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

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/posts/${post.slug}`}>
        {/* Image */}
        <div className="relative h-48 bg-gray-200">
          {post.featured_image ? (
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
          {/* Category Badge */}
          <Link
            href={`/category/${encodeURIComponent(post.category)}`}
            className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-700 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {post.category}
          </Link>
        </div>

        {/* Content */}
        <div className="p-4">
          <h2 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2">
            {post.title}
          </h2>
          {post.description && (
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
              {post.description}
            </p>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">{formattedDate}</span>
            {formattedPrice && (
              <span className="font-semibold text-green-600">{formattedPrice}</span>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}
