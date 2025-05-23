"use client"

import dynamic from "next/dynamic"

// 動的インポートでArticleListを遅延ロード
const ArticleList = dynamic(() => import("@/components/article-list"), {
  loading: () => (
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
  ),
  ssr: true, // SSRを有効にする
})

export default function ArticleListClient() {
  return <ArticleList />
}
