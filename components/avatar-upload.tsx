"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, X } from "lucide-react"
import { uploadAvatar, deleteAvatar } from "@/lib/profile-service"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AvatarUploadProps {
  currentAvatarUrl: string | null
  onAvatarChange: (url: string | null) => void
}

export default function AvatarUpload({ currentAvatarUrl, onAvatarChange }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // エラーをリセット
    setError(null)

    // ファイルサイズチェック（10MB制限）
    if (file.size > 10 * 1024 * 1024) {
      setError("ファイルサイズは10MB以下にしてください")
      return
    }

    // ファイルタイプチェック
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください")
      return
    }

    try {
      setIsUploading(true)

      // プレビュー用のURL作成
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

      console.log("Starting avatar upload process")

      // Supabaseにアップロード
      const avatarUrl = await uploadAvatar(file)

      if (avatarUrl) {
        console.log("Avatar uploaded successfully, URL:", avatarUrl)

        // 以前のアバターがある場合は削除
        if (currentAvatarUrl) {
          try {
            console.log("Deleting previous avatar")
            await deleteAvatar(currentAvatarUrl)
          } catch (error) {
            console.error("Failed to delete previous avatar:", error)
            // 前のアバター削除に失敗しても、新しいアバターのアップロードは続行
          }
        }

        // 親コンポーネントに新しいURLを通知
        onAvatarChange(avatarUrl)

        toast({
          title: "アップロード完了",
          description: "プロフィール画像がアップロードされました",
        })
      }
    } catch (error: any) {
      console.error("Avatar upload error:", error)

      // エラーメッセージの詳細を表示
      const errorMessage = error?.message || "画像のアップロード中にエラーが発生しました"
      setError(errorMessage)

      // エラーが発生した場合はプレビューを元に戻す
      setPreviewUrl(currentAvatarUrl)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!currentAvatarUrl) return

    try {
      setIsUploading(true)
      setError(null)

      console.log("Starting avatar deletion process")

      try {
        await deleteAvatar(currentAvatarUrl)
        console.log("Avatar deleted successfully")
      } catch (error) {
        console.error("Failed to delete avatar:", error)
        // 削除に失敗しても、UIからは削除する
      }

      setPreviewUrl(null)

      // 親コンポーネントにnullを通知
      onAvatarChange(null)

      toast({
        title: "削除完了",
        description: "プロフィール画像が削除されました",
      })
    } catch (error: any) {
      console.error("Avatar delete error:", error)

      // エラーメッセージの詳細を表示
      const errorMessage = error?.message || "画像の削除中にエラーが発生しました"
      setError(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={isUploading}
      />

      {error && (
        <Alert variant="destructive" className="mb-2 p-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={previewUrl || ""} alt="プロフィール画像" />
          <AvatarFallback className="text-lg">{previewUrl ? "読込中" : "未設定"}</AvatarFallback>
        </Avatar>

        {previewUrl && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleRemoveAvatar}
            disabled={isUploading}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={triggerFileInput}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {isUploading ? "アップロード中..." : "画像をアップロード"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">10MB以下の画像ファイル</p>
      </div>
    </div>
  )
}
