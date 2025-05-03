"use client"

import type React from "react"
import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, Quote, LinkIcon, ImageIcon, Lock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface ArticleFormProps {
  onSubmit: (title: string, content: string, accessLevel: "FREE" | "BASIC" | "PRO" | "VIP") => void
  isSubmitting: boolean
  initialTitle?: string
  initialContent?: string
  initialAccessLevel?: "FREE" | "BASIC" | "PRO" | "VIP"
}

export default function ArticleForm({
  onSubmit,
  isSubmitting,
  initialTitle = "",
  initialContent = "",
  initialAccessLevel = "FREE",
}: ArticleFormProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [accessLevel, setAccessLevel] = useState<"FREE" | "BASIC" | "PRO" | "VIP">(initialAccessLevel)
  const [errors, setErrors] = useState({ title: "", content: "" })
  const [activeTab, setActiveTab] = useState<string>("write")
  const { isAdmin } = useAuth()

  useEffect(() => {
    setTitle(initialTitle)
    setContent(initialContent)
    setAccessLevel(initialAccessLevel)
  }, [initialTitle, initialContent, initialAccessLevel])

  const validate = () => {
    const newErrors = { title: "", content: "" }
    let isValid = true

    if (!title.trim()) {
      newErrors.title = "タイトルを入力してください"
      isValid = false
    }

    if (!content.trim()) {
      newErrors.content = "内容を入力してください"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(title, content, accessLevel)
    }
  }

  const insertMarkdown = (markdownSyntax: string, placeholder?: string) => {
    const textarea = document.getElementById("content") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const beforeText = content.substring(0, start)
    const afterText = content.substring(end)

    let newText = ""
    if (selectedText) {
      // テキストが選択されている場合
      newText = beforeText + markdownSyntax.replace("$1", selectedText) + afterText
    } else if (placeholder) {
      // プレースホルダーを使用
      newText = beforeText + markdownSyntax.replace("$1", placeholder) + afterText
    } else {
      // 単純に構文を挿入
      newText = beforeText + markdownSyntax + afterText
    }

    setContent(newText)
    // フォーカスを戻す
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + markdownSyntax.indexOf("$1")
      if (newCursorPos > start && placeholder) {
        textarea.setSelectionRange(
          start + markdownSyntax.indexOf("$1"),
          start + markdownSyntax.indexOf("$1") + placeholder.length,
        )
      } else {
        textarea.setSelectionRange(start + markdownSyntax.length, start + markdownSyntax.length)
      }
    }, 0)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">タイトル</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="記事のタイトルを入力"
            disabled={isSubmitting}
          />
          {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="accessLevel" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            閲覧レベル
          </Label>
          <Select value={accessLevel} onValueChange={(value) => setAccessLevel(value as any)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="閲覧レベルを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FREE">ログインユーザーなら誰でも閲覧可能</SelectItem>
              <SelectItem value="BASIC">BASIC以上のプラン限定</SelectItem>
              <SelectItem value="PRO">PRO以上のプラン限定</SelectItem>
              <SelectItem value="VIP">VIPプラン限定</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {accessLevel === "FREE" && "すべてのログインユーザーが閲覧できます"}
            {accessLevel === "BASIC" && "BASIC、PRO、VIPプランのユーザーのみ閲覧できます"}
            {accessLevel === "PRO" && "PRO、VIPプランのユーザーのみ閲覧できます"}
            {accessLevel === "VIP" && "VIPプランのユーザーのみ閲覧できます"}
            {isAdmin && " (管理者はすべての記事を閲覧・編集できます)"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">内容（マークダウン対応）</Label>

          <div className="flex flex-wrap gap-1 mb-2">
            <Button type="button" variant="outline" size="sm" onClick={() => insertMarkdown("**$1**", "太字テキスト")}>
              <Bold className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => insertMarkdown("*$1*", "斜体テキスト")}>
              <Italic className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => insertMarkdown("## $1", "見出し")}>
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => insertMarkdown("### $1", "小見出し")}>
              <Heading3 className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => insertMarkdown("- $1", "リスト項目")}>
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insertMarkdown("1. $1", "番号付きリスト項目")}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => insertMarkdown("> $1", "引用テキスト")}>
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insertMarkdown("[$1](URL)", "リンクテキスト")}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insertMarkdown("![$1](URL)", "画像の説明")}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>

          <Tabs defaultValue="write" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-2">
              <TabsTrigger value="write">編集</TabsTrigger>
              <TabsTrigger value="preview">プレビュー</TabsTrigger>
            </TabsList>
            <TabsContent value="write" className="mt-0">
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="マークダウン形式で記事を入力できます"
                className="min-h-[300px] font-mono"
                disabled={isSubmitting}
              />
            </TabsContent>
            <TabsContent value="preview" className="mt-0">
              <Card className="p-4 min-h-[300px] overflow-auto">
                <div className="prose dark:prose-invert max-w-none">
                  {content ? (
                    <ReactMarkdown>{content}</ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground">プレビューするコンテンツがありません</p>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
          {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>
    </form>
  )
}
