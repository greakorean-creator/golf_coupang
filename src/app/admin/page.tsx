'use client'

import { useState, useEffect } from 'react'

interface FaqItem {
  question: string
  answer: string
}

interface Post {
  id: string
  slug: string
  title: string
  description: string | null
  content: string
  featured_image: string | null
  coupang_url: string | null
  coupang_product_id: string | null
  product_name: string | null
  product_price: number | null
  category: string
  tags: string[] | null
  seo_keywords: string[] | null
  faq: FaqItem[] | null
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

type PostFormData = {
  title: string
  slug: string
  description: string
  content: string
  featured_image: string
  coupang_url: string
  coupang_product_id: string
  product_name: string
  product_price: string
  category: string
  tags: string
  seo_keywords: string
  faq: FaqItem[]
  is_published: boolean
}

const CATEGORIES = [
  '드라이버',
  '아이언',
  '퍼터',
  '웨지',
  '우드',
  '유틸리티',
  '골프백',
  '골프공',
  '골프의류',
  '골프액세서리',
  '기타',
  '정보',
]

const INFO_TOPICS = [
  '골프 스윙 기초',
  '골프 에티켓과 규칙',
  '골프 용어 정리',
  '초보자 연습 방법',
  '그립 잡는 방법',
  '퍼팅 기술 향상',
  '드라이버 비거리 늘리기',
  '아이언 정확도 높이기',
  '골프 코스 전략',
  '골프 피트니스',
]

export default function AdminPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [infoTopic, setInfoTopic] = useState('')
  const [generatingInfo, setGeneratingInfo] = useState(false)

  const emptyForm: PostFormData = {
    title: '',
    slug: '',
    description: '',
    content: '',
    featured_image: '',
    coupang_url: '',
    coupang_product_id: '',
    product_name: '',
    product_price: '',
    category: '드라이버',
    tags: '',
    seo_keywords: '',
    faq: [],
    is_published: false,
  }

  const [formData, setFormData] = useState<PostFormData>(emptyForm)

  // Load posts on mount
  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    try {
      setLoading(true)
      const res = await fetch('/api/posts')

      // Check if response is ok before parsing JSON
      const text = await res.text()
      if (!text) {
        throw new Error('Empty response from server. Check SUPABASE_SERVICE_KEY environment variable.')
      }

      let data
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`)
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load posts')
      }

      setPosts(data.posts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }))
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function handleFaqChange(index: number, field: 'question' | 'answer', value: string) {
    setFormData(prev => ({
      ...prev,
      faq: prev.faq.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  function addFaq() {
    setFormData(prev => ({
      ...prev,
      faq: [...prev.faq, { question: '', answer: '' }],
    }))
  }

  function removeFaq(index: number) {
    setFormData(prev => ({
      ...prev,
      faq: prev.faq.filter((_, i) => i !== index),
    }))
  }

  function startNewPost() {
    setEditingPost(null)
    setFormData(emptyForm)
    setShowForm(true)
    setError(null)
    setSuccess(null)
  }

  function startEditPost(post: Post) {
    setEditingPost(post)
    setFormData({
      title: post.title,
      slug: post.slug,
      description: post.description || '',
      content: post.content,
      featured_image: post.featured_image || '',
      coupang_url: post.coupang_url || '',
      coupang_product_id: post.coupang_product_id || '',
      product_name: post.product_name || '',
      product_price: post.product_price?.toString() || '',
      category: post.category,
      tags: post.tags?.join(', ') || '',
      seo_keywords: post.seo_keywords?.join(', ') || '',
      faq: post.faq || [],
      is_published: post.is_published,
    })
    setShowForm(true)
    setError(null)
    setSuccess(null)
  }

  function cancelEdit() {
    setShowForm(false)
    setEditingPost(null)
    setFormData(emptyForm)
    setError(null)
    setSuccess(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      const seoKeywords = formData.seo_keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0)

      const postBody = {
        ...(editingPost && { id: editingPost.id }),
        title: formData.title,
        slug: formData.slug,
        description: formData.description || null,
        content: formData.content,
        featured_image: formData.featured_image || null,
        coupang_url: formData.coupang_url || null,
        coupang_product_id: formData.coupang_product_id || null,
        product_name: formData.product_name || null,
        product_price: formData.product_price ? Number(formData.product_price) : null,
        category: formData.category,
        tags,
        seo_keywords: seoKeywords,
        faq: formData.faq.filter(f => f.question && f.answer),
        is_published: formData.is_published,
      }

      const res = await fetch('/api/posts', {
        method: editingPost ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postBody),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save post')
      }

      setSuccess(editingPost ? '포스트가 수정되었습니다!' : '포스트가 생성되었습니다!')
      await loadPosts()
      setShowForm(false)
      setEditingPost(null)
      setFormData(emptyForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(post: Post) {
    if (!confirm(`"${post.title}" 포스트를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const res = await fetch(`/api/posts?id=${post.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete post')
      }

      setSuccess('포스트가 삭제되었습니다!')
      await loadPosts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post')
    }
  }

  async function handleGenerateInfoPost() {
    if (!infoTopic.trim()) {
      setError('주제를 입력해주세요')
      return
    }

    setError(null)
    setSuccess(null)
    setGeneratingInfo(true)

    try {
      const res = await fetch('/api/generate-info-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: infoTopic }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate info post')
      }

      setSuccess(`정보 포스트가 생성되었습니다: ${data.post.title}`)
      setShowInfoModal(false)
      setInfoTopic('')
      await loadPosts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate info post')
    } finally {
      setGeneratingInfo(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">관리자 페이지</h1>
              <p className="text-gray-600 mt-1">포스트 작성 및 관리</p>
            </div>
            <div className="flex gap-4">
              <a
                href="/"
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                블로그로 돌아가기
              </a>
              {!showForm ? (
                <button
                  type="button"
                  onClick={() => setShowInfoModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  정보 포스트 생성
                </button>
              ) : null}
              {!showForm ? (
                <button
                  type="button"
                  onClick={startNewPost}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  새 포스트 작성
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Info Post Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">정보 포스트 생성</h2>
              <button
                onClick={() => {
                  setShowInfoModal(false)
                  setInfoTopic('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              AI가 골프 정보 포스트를 자동으로 작성합니다. 주제를 입력하거나 추천 주제를 선택하세요.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                주제 입력
              </label>
              <input
                type="text"
                value={infoTopic}
                onChange={(e) => setInfoTopic(e.target.value)}
                placeholder="예: 골프 스윙의 기본 원리"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={generatingInfo}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                추천 주제
              </label>
              <div className="flex flex-wrap gap-2">
                {INFO_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setInfoTopic(topic)}
                    disabled={generatingInfo}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      infoTopic === topic
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleGenerateInfoPost}
                disabled={generatingInfo || !infoTopic.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingInfo ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    생성 중...
                  </span>
                ) : (
                  '생성하기'
                )}
              </button>
              <button
                onClick={() => {
                  setShowInfoModal(false)
                  setInfoTopic('')
                }}
                disabled={generatingInfo}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingPost ? '포스트 수정' : '새 포스트 작성'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleTitleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="포스트 제목을 입력하세요"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  슬러그 (URL) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="post-url-slug"
                />
                <p className="mt-1 text-xs text-gray-500">URL에 사용될 고유 식별자입니다</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리 <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="포스트에 대한 간략한 설명"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  required
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                  placeholder="HTML 형식으로 내용을 작성하세요"
                />
                <p className="mt-1 text-xs text-gray-500">HTML 태그를 사용할 수 있습니다</p>
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  대표 이미지 URL
                </label>
                <input
                  type="url"
                  name="featured_image"
                  value={formData.featured_image}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Product Info Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">상품 정보</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상품명
                    </label>
                    <input
                      type="text"
                      name="product_name"
                      value={formData.product_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="상품명"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상품 가격 (원)
                    </label>
                    <input
                      type="number"
                      name="product_price"
                      value={formData.product_price}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="199000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      쿠팡 상품 ID
                    </label>
                    <input
                      type="text"
                      name="coupang_product_id"
                      value={formData.coupang_product_id}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="123456789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      쿠팡 링크 URL
                    </label>
                    <input
                      type="url"
                      name="coupang_url"
                      value={formData.coupang_url}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="https://www.coupang.com/..."
                    />
                  </div>
                </div>
              </div>

              {/* SEO Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO 설정</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      태그 (쉼표로 구분)
                    </label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="골프, 드라이버, 캘러웨이"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SEO 키워드 (쉼표로 구분)
                    </label>
                    <input
                      type="text"
                      name="seo_keywords"
                      value={formData.seo_keywords}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="골프 드라이버 추천, 초보자 드라이버"
                    />
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">FAQ</h3>
                  <button
                    type="button"
                    onClick={addFaq}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    + FAQ 추가
                  </button>
                </div>

                {formData.faq.map((faq, index) => (
                  <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-700">FAQ #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeFaq(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        삭제
                      </button>
                    </div>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={e => handleFaqChange(index, 'question', e.target.value)}
                      className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="질문"
                    />
                    <textarea
                      value={faq.answer}
                      onChange={e => handleFaqChange(index, 'answer', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="답변"
                    />
                  </div>
                ))}
              </div>

              {/* Publish Checkbox */}
              <div className="border-t pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_published"
                    checked={formData.is_published}
                    onChange={handleChange}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">즉시 게시</span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  체크하면 저장 즉시 블로그에 공개됩니다
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? '저장 중...' : editingPost ? '수정하기' : '저장하기'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">
              포스트 목록 ({posts.length}개)
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">로딩 중...</div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              아직 작성된 포스트가 없습니다.
            </div>
          ) : (
            <div className="divide-y">
              {posts.map(post => (
                <div key={post.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {post.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            post.is_published
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {post.is_published ? '게시됨' : '임시저장'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        /{post.slug} · {post.category}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(post.created_at).toLocaleDateString('ko-KR')} 생성
                        {post.updated_at !== post.created_at && (
                          <> · {new Date(post.updated_at).toLocaleDateString('ko-KR')} 수정</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {post.is_published ? (
                        <a
                          href={`/posts/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          보기
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => startEditPost(post)}
                        className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(post)}
                        className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
