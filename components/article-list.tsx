"use client"

import { useEffect, useState, useCallback, memo, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Lock, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDate, stripMarkdown } from "@/lib/utils"
import type { Article } from "@/lib/types"
import { getArticles, deleteArticle } from "@/lib/article-service"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { getProfileByUserId } from "@/lib/profile-service"
import type { UserProfile } from "@/lib/types"

// 個別の記事カードをメモ化
const ArticleCard = memo(
  ({
    article,
    isAuthor,
    isAdmin,
    onDelete,
  }: {
    article: Article
    isAuthor: boolean
    isAdmin: boolean
    onDelete: (id: string) => void
  }) => {
    // 記事の内容を事前に処理して最適化
    const truncatedContent = useMemo(() => {
      const stripped = stripMarkdown(article.content)
      return stripped.length > 150 ? stripped.substring(0, 150) + "..." : stripped
    }, [article.content])

    // 日付のフォーマットを事前に計算
    const formattedDate = useMemo(() => formatDate(article.created_at), [article.created_at])
    const formattedUpdateDate = useMemo(
      () => (article.updated_at ? formatDate(article.updated_at) : null),
      [article.updated_at],
    )

    // プロフィール用のステート
    const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null)

    // 投稿者情報を取得
    useEffect(() => {
      const fetchAuthorProfile = async () => {
        if (article.user_id) {
          try {
            const profile = await getProfileByUserId(article.user_id)
            setAuthorProfile(profile)
          } catch (error) {
            console.error("プロフィール取得エラー:", error)
          }
        }
      }

      fetchAuthorProfile()
    }, [article.user_id])

    return (
      <Card className="flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="line-clamp-2">
              <Link href={`/articles/${article.id}`} className="hover:underline">
                {article.title}
              </Link>
            </CardTitle>
            {article.access_level === "OPEN" && (
              <Badge variant="outline" className="ml-2 bg-green-50 text-green-800 border-green-200">
                <Globe className="mr-1 h-3 w-3" />
                一般公開
              </Badge>
            )}
            {article.access_level !== "FREE" && article.access_level !== "OPEN" && (
              <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-800 border-amber-200">
                <Lock className="mr-1 h-3 w-3" />
                {article.access_level}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-3 py-2">
          {/* 記事本文 */}
          <div>
            <p className="line-clamp-3 text-muted-foreground">{truncatedContent}</p>
          </div>

          {/* 投稿者情報 */}
          <div className="flex items-center pt-2">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage src={authorProfile?.avatar_url || ""} alt={authorProfile?.nickname || "ユーザー"} />
              <AvatarFallback className="text-xs">{authorProfile?.nickname?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{authorProfile?.nickname || "不明なユーザー"}</span>
          </div>

          {/* 作成日・更新日 */}
          <div className="text-xs text-muted-foreground">
            <p>作成日: {formattedDate}</p>
            {formattedUpdateDate && <p>更新日: {formattedUpdateDate}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <Link href={`/articles/${article.id}`}>
            <Button variant="outline" size="sm">
              閲覧
            </Button>
          </Link>
          {(isAuthor || isAdmin) && (
            <div className="flex gap-2">
              <Link href={`/articles/${article.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => onDelete(article.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    )
  },
)

ArticleCard.displayName = "ArticleCard"

// ローディングスケルトン
const ArticleListSkeleton = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="flex flex-col">
          <CardHeader>
            <div className="h-6 bg-muted rounded animate-pulse w-3/4"></div>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="h-4 bg-muted rounded animate-pulse w-1/4 mb-2"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-full mb-1"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-full mb-1"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-2/3"></div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="h-9 bg-muted rounded animate-pulse w-16"></div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

// 記事一覧コンポーネント
export default function ArticleList() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchTrigger, setFetchTrigger] = useState(0)
  const { toast } = useToast()
  const { user, isAdmin } = useAuth()

  // 記事の取得をメモ化
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getArticles()
      setArticles(data)
      setError(null)
    } catch (err: any) {
      console.error("Error fetching articles:", err)
      setError("記事の読み込み中にエラーが発生しました: " + (err.message || "不明なエラー"))
      toast({
        title: "エラーが発生しました",
        description: "記事の読み込み中にエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      // 重要: データ取得が完了したら、必ずローディング状態を解除する
      setLoading(false)
    }
  }, [toast])

  // useEffectの依存配列を修正し、無限ループを防止
  useEffect(() => {
    let isMounted = true

    const loadArticles = async () => {
      try {
        await fetchArticles()
      } catch (error) {
        console.error("Failed to load articles:", error)
      }
    }

    loadArticles()

    return () => {
      isMounted = false
    }
    // fetchTriggerを依存配列に追加し、明示的に再取得をトリガーできるようにする
  }, [fetchTrigger, fetchArticles])

  // 記事削除処理をメモ化
  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm("この記事を削除してもよろしいですか？")) {
        try {
          await deleteArticle(id)
          // 状態を直接更新する代わりに、再取得をトリガー
          setFetchTrigger((prev) => prev + 1)
          toast({
            title: "記事を削除しました",
            description: "記事が正常に削除されました。",
          })
        } catch (err) {
          console.error("Error deleting article:", err)
          toast({
            title: "エラーが発生しました",
            description: "記事の削除中にエラーが発生しました。",
            variant: "destructive",
          })
        }
      }
    },
    [toast],
  )

  if (loading) {
    return <ArticleListSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => setFetchTrigger((prev) => prev + 1)}>再読み込み</Button>
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">まだ記事がありません。</p>
        {user && (
          <Link href="/articles/_new">
            <Button>最初の記事を作成する</Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => {
        const isAuthor = user && article.user_id === user.id
        return (
          <ArticleCard
            key={article.id}
            article={article}
            isAuthor={isAuthor}
            isAdmin={isAdmin}
            onDelete={handleDelete}
          />
        )
      })}
    </div>
  )
}
