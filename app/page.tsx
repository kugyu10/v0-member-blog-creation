import { Suspense } from "react"
import { NewArticleButton } from "@/components/new-article-button"
import ArticleListClient from "@/components/article-list-client"

export default function Home() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">ブログ記事一覧</h1>
        <NewArticleButton />
      </div>
      <Suspense
        fallback={
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border rounded-lg shadow-sm flex flex-col">
                <div className="p-6 border-b">
                  <div className="h-6 bg-muted rounded animate-pulse w-3/4"></div>
                </div>
                <div className="p-6 flex-grow">
                  <div className="h-4 bg-muted rounded animate-pulse w-1/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-full mb-1"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-full mb-1"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-2/3"></div>
                </div>
                <div className="p-6 border-t flex justify-between">
                  <div className="h-9 bg-muted rounded animate-pulse w-16"></div>
                </div>
              </div>
            ))}
          </div>
        }
      >
        <ArticleListClient />
      </Suspense>
    </div>
  )
}
