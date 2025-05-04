"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Upload, Loader2 } from "lucide-react"
import { uploadImage, isValidImageUrl } from "@/lib/image-service"

interface ImageUploadDialogProps {
  open: boolean
  onClose: () => void
  onImageSelected: (imageUrl: string) => void
}

export default function ImageUploadDialog({ open, onClose, onImageSelected }: ImageUploadDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("upload")
  const [imageUrl, setImageUrl] = useState<string>("")
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setIsUploading(true)

    try {
      const uploadedUrl = await uploadImage(file)
      if (uploadedUrl) {
        onImageSelected(uploadedUrl)
        onClose()
      }
    } catch (err: any) {
      setError(err.message || "画像のアップロードに失敗しました")
    } finally {
      setIsUploading(false)
    }
  }

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) {
      setError("URLを入力してください")
      return
    }

    setError(null)
    setIsValidating(true)

    try {
      const isValid = await isValidImageUrl(imageUrl)
      if (isValid) {
        onImageSelected(imageUrl)
        onClose()
      } else {
        setError("無効な画像URLです")
      }
    } catch (err) {
      setError("URLの検証中にエラーが発生しました")
    } finally {
      setIsValidating(false)
    }
  }

  const handleClose = () => {
    setImageUrl("")
    setError(null)
    setActiveTab("upload")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>画像の挿入</DialogTitle>
          <DialogDescription>画像をアップロードするか、URLを入力してください</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">アップロード</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="py-4">
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  disabled={isUploading}
                />
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-1">クリックして画像を選択</p>
                <p className="text-xs text-muted-foreground">または画像をドラッグ＆ドロップ</p>
                {isUploading && <Loader2 className="h-4 w-4 animate-spin mt-2" />}
              </div>
              <Button
                type="button"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? "アップロード中..." : "画像を選択"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="url" className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">画像URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    disabled={isValidating}
                  />
                </div>
              </div>
              <Button
                type="button"
                className="w-full"
                onClick={handleUrlSubmit}
                disabled={isValidating || !imageUrl.trim()}
              >
                {isValidating ? "検証中..." : "URLを使用"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading || isValidating}>
            キャンセル
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
