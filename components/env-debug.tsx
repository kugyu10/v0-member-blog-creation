"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function EnvDebug() {
  const [open, setOpen] = useState(false)
  const [envStatus, setEnvStatus] = useState<boolean>(false)

  const checkEnv = () => {
    // 環境変数の存在チェック（値は表示しない）
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasSupabaseAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // 両方の環境変数が設定されているかどうか
    setEnvStatus(hasSupabaseUrl && hasSupabaseAnonKey)
    setOpen(true)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
          onClick={checkEnv}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          接続診断
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>接続ステータス</DialogTitle>
          <DialogDescription>アプリケーションの接続状態を確認します。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="p-4 border rounded">
            <h3 className="font-medium mb-2">環境変数ステータス</h3>
            <div className={`p-2 rounded ${envStatus ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {envStatus ? "✅ 必要な環境変数が設定されています" : "❌ 一部の環境変数が設定されていません"}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            接続に問題がある場合は、Vercelのプロジェクト設定で環境変数を確認してください。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
