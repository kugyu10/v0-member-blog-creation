"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ArticleForm from "@/components/article-form"
import { createArticle } from "@/lib/article-service"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function NewArticlePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const { user, userPlan, isAdmin, isLoading } = useAuth()

  useEffect(() => {
    // 認証情報のロードが完了するまで待機
    if (isLoading) return

    // ユーザーがBASIC以上のプランを持っているか、または管理者かをチェック
    const checkAuthorization = () => {
      setIsChecking(true)
      if (!user) {
        setIsAuthorized(false)
        setIsChecking(false)
        return
      }

      const canCreateArticle = isAdmin || (userPlan && ["BASIC", "PRO", "VIP"].includes(userPlan.name))
      setIsAuthorized(canCreateArticle)
      setIsChecking(false)
    }

    checkAuthorization()
  }, [user, userPlan, isAdmin, isLoading])

  const handleSubmit = async (
    title: string,
    content: string,
    accessLevel: "OPEN" | "FREE" | "BASIC" | "PRO" | "VIP",
  ) => {
    if (!isAuthorized) return

    setIsSubmitting(true)

    try {
      const newArticle = await createArticle({ title, content, access_level: accessLevel })

      toast({
        title: "記事を作成しました",
        description: "記事が正常に作成されました。",
      })

      // 作成した記事の詳細ページにリダイレクト
      router.push(`/articles/${newArticle.id}`)
    } catch (error) {
      console.error("記事作成エラー:", error)

      toast({
        title: "エラーが発生しました",
        description: "記事の作成中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      })

      setIsSubmitting(false)
    }
  }

  // 認証情報のロード中
  if (isLoading || isChecking) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p>読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Link href="/articles">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              記事一覧に戻る
            </Button>
          </Link>
        </div>

        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <Lock className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-800">アクセス制限</AlertTitle>
          <AlertDescription className="text-amber-700">
            記事を作成するにはBASIC以上のプランが必要です。現在のプラン: {userPlan?.name || "不明"}
            <div className="mt-4">
              <Link href="/plans">
                <Button variant="outline" size="sm">
                  プランをアップグレードする
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/articles">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            記事一覧に戻る
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">新規記事作成</h1>

      <ArticleForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  )
}
