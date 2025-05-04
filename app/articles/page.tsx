import { NewArticleButton } from "@/components/new-article-button"
import ArticleListClient from "@/components/article-list-client"

// Suspenseの使い方を修正
export default function ArticlesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">ブログ記事一覧</h1>
        <NewArticleButton />
      </div>
      {/* Suspenseのフォールバックを短くして、クライアントコンポーネントを直接レンダリング */}
      <ArticleListClient />
    </div>
  )
}
