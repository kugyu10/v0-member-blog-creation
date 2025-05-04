"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Trash2, Lock, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import type { Article } from "@/lib/types"
import { getArticleById, deleteArticle, checkArticleAccess } from "@/lib/article-service"
import { getProfileByUserId } from "@/lib/profile-service"
import UserProfileCard from "@/components/user-profile-card"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function ArticleDetail({ params }: { params: { id: string } }) {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authorProfile, setAuthorProfile] = useState(null)
  const [hasAccess, setHasAccess] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const { user, userPlan, isAdmin } = useAuth()

  useEffect(() => {
    async function fetchArticle() {
      try {
        setLoading(true)

        // まず記事へのアクセス権があるか確認
        const access = await checkArticleAccess(params.id)
        setHasAccess(access)

        if (!access) {
          setError("この記事を閲覧する権限がありません")
          setLoading(false)
          return
        }

        const data = await getArticleById(params.id)
        setArticle(data)

        if (!data) {
          setError("記事が見つかりませんでした")
        } else {
          setError(null)

          // 記事作成者のプロフィールを取得
          if (data.user_id) {
            const profile = await getProfileByUserId(data.user_id)
            setAuthorProfile(profile)
          }
        }
      } catch (err) {
        console.error(`Error fetching article with id ${params.id}:`, err)
        setError("記事の読み込み中にエラーが発生しました")
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [params.id])

  const handleDelete = async () => {
    if (window.confirm("この記事を削除してもよろしいですか？")) {
      try {
        await deleteArticle(params.id)
        toast({
          title: "記事を削除しました",
          description: "記事が正常に削除されました。",
        })
        router.push("/articles")
      } catch (err) {
        console.error(`Error deleting article with id ${params.id}:`, err)
        toast({
          title: "エラーが発生しました",
          description: "記事の削除中にエラーが発生しました。",
          variant: "destructive",
        })
      }
    }
  }

  if (loading) {
    return <div className="container mx-auto py-8">読み込み中...</div>
  }

  if (!hasAccess) {
    const planName = userPlan?.name || "未ログイン"
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
            この記事はより高いプランのユーザーのみ閲覧できます。現在のプラン: {planName}
            <div className="mt-4">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  ログインする
                </Button>
              </Link>
              {user && (
                <Link href="/plans" className="ml-2">
                  <Button variant="outline" size="sm">
                    プランをアップグレードする
                  </Button>
                </Link>
              )}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-red-500">{error || "記事が見つかりませんでした"}</p>
        <Link href="/articles">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            記事一覧に戻る
          </Button>
        </Link>
      </div>
    )
  }

  const isAuthor = user && article.user_id === user.id

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

      {/* 1. タイトル部分 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{article.title}</h1>
        <div className="mt-2">
          {article.access_level === "OPEN" && (
            <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
              <Globe className="mr-1 h-3 w-3" />
              一般公開
            </Badge>
          )}
          {article.access_level !== "FREE" && article.access_level !== "OPEN" && (
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
              <Lock className="mr-1 h-3 w-3" />
              {article.access_level === "BASIC" && "BASIC以上限定"}
              {article.access_level === "PRO" && "PRO以上限定"}
              {article.access_level === "VIP" && "VIP限定"}
            </Badge>
          )}

          {(isAuthor || isAdmin) && (
            <div className="flex gap-2 mt-4">
              <Link href={`/articles/${params.id}/edit`}>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  編集
                </Button>
              </Link>
              <Button variant="outline" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                削除
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 2. 記事本文 */}
      <div className="prose max-w-none dark:prose-invert mb-8">
        <ReactMarkdown>{article.content}</ReactMarkdown>
      </div>

      {/* 3. 投稿者情報 */}
      {authorProfile && (
        <div className="mb-6 border-t pt-6">
          <h2 className="text-lg font-semibold mb-3">投稿者</h2>
          <UserProfileCard profile={authorProfile} planName={userPlan?.name} />
        </div>
      )}

      {/* 4. 作成日・更新日 */}
      <div className="text-sm text-muted-foreground border-t pt-4">
        <p>作成日: {formatDate(article.created_at)}</p>
        {article.updated_at && <p>更新日: {formatDate(article.updated_at)}</p>}
      </div>
    </div>
  )
}
