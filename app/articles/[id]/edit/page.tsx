"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ArticleForm from "@/components/article-form"
import type { Article } from "@/lib/types"
import { getArticleById, updateArticle } from "@/lib/article-service"

export default function EditArticle({ params }: { params: { id: string } }) {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchArticle() {
      try {
        setLoading(true)
        const data = await getArticleById(params.id)
        setArticle(data)
        if (!data) {
          setError("記事が見つかりませんでした")
        } else {
          setError(null)
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

  const handleSubmit = async (title: string, content: string, accessLevel: "FREE" | "BASIC" | "PRO" | "VIP") => {
    if (!article) return

    setIsSubmitting(true)
    try {
      await updateArticle(params.id, { title, content, access_level: accessLevel })
      toast({
        title: "記事を更新しました",
        description: "記事が正常に更新されました。",
      })
      router.push(`/articles/${params.id}`)
    } catch (err) {
      console.error(`Error updating article with id ${params.id}:`, err)
      toast({
        title: "エラーが発生しました",
        description: "記事の更新中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="container mx-auto py-8">読み込み中...</div>
  }

  if (error || !article) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-red-500">{error || "記事が見つかりませんでした"}</p>
        <Link href="/">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            記事一覧に戻る
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href={`/articles/${params.id}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            記事に戻る
          </Button>
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-8">記事の編集</h1>
      <ArticleForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        initialTitle={article.title}
        initialContent={article.content}
        initialAccessLevel={article.access_level}
      />
    </div>
  )
}
