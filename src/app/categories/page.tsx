import { Metadata } from 'next'
import Link from 'next/link'
import { getCategories } from '@/lib/supabase-server'

export const metadata: Metadata = {
  title: '카테고리',
  description: '골프 장비 카테고리별 리뷰 모음 - 드라이버, 아이언, 퍼터, 웨지 등',
}

export const revalidate = 3600

export default async function CategoriesPage() {
  const categories = await getCategories()

  // Category icons mapping
  const categoryIcons: Record<string, string> = {
    '드라이버': 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    '아이언': 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    '퍼터': 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    '웨지': 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    '골프공': 'M12 2a10 10 0 100 20 10 10 0 000-20z',
    '골프백': 'M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z',
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/" className="text-green-600 hover:text-green-700 text-sm">
            ← 홈으로
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">카테고리</h1>
          <p className="text-gray-600 mt-1">
            카테고리별 골프 장비 리뷰를 확인하세요
          </p>
        </div>
      </header>

      {/* Categories Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">등록된 카테고리가 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/category/${encodeURIComponent(category.name)}`}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={categoryIcons[category.name] || 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'}
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                      {category.name}
                    </h2>
                    <p className="text-gray-500 text-sm">
                      {category.count}개의 리뷰
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Total Stats */}
        {categories.length > 0 && (
          <div className="mt-8 text-center text-gray-500 text-sm">
            총 {categories.length}개의 카테고리, {categories.reduce((sum, cat) => sum + cat.count, 0)}개의 리뷰
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <Link href="/" className="text-green-600 hover:text-green-700">
            ← 모든 리뷰 보기
          </Link>
        </div>
      </footer>
    </main>
  )
}
