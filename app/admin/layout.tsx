"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users, LayoutDashboard, ArrowLeft } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth()
  const router = useRouter()

  // 管理者でない場合はホームページにリダイレクト
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/")
    }
  }, [isAdmin, isLoading, router])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center">
          <p>読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null // リダイレクト中は何も表示しない
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            サイトに戻る
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">管理画面</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                <Link href="/admin" className="flex items-center p-2 rounded-md hover:bg-muted">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  ダッシュボード
                </Link>
                <Link href="/admin/users" className="flex items-center p-2 rounded-md hover:bg-muted">
                  <Users className="mr-2 h-4 w-4" />
                  ユーザー管理
                </Link>
              </nav>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Card>
            <CardContent className="p-6">{children}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
