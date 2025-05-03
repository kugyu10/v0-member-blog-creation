"use client"

import dynamic from "next/dynamic"

// ヘッダーを動的にインポート
const Header = dynamic(() => import("@/components/header"), {
  ssr: false,
  loading: () => (
    <div className="border-b">
      <div className="container mx-auto py-4 flex items-center justify-between">
        <div className="text-2xl font-bold">会員制ブログシステム</div>
        <div className="h-9 w-24 bg-muted animate-pulse rounded-md"></div>
      </div>
    </div>
  ),
})

export default function HeaderClient() {
  return <Header />
}
