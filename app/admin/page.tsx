import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText } from "lucide-react"

export default function AdminDashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">管理ダッシュボード</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/users">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xl">ユーザー管理</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>ユーザーの一覧表示、管理者権限の設定、アカウントの停止などを行います。</CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xl">記事管理</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>すべての記事を管理します。（準備中）</CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
