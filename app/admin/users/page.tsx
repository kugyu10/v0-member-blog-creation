"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"

interface UserWithRole {
  id: string
  email: string | null
  created_at: string
  is_admin: boolean
  plan: {
    id: string
    name: string
  } | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [plans, setPlans] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)

      // プラン一覧を取得
      const { data: plansList, error: plansError } = await supabase.from("plans").select("id, name")

      if (plansError) {
        throw plansError
      }

      setPlans(plansList || [])

      // ユーザープロフィールを取得
      const { data: userProfiles, error: profilesError } = await supabase.from("user_profiles").select(`
        id,
        user_id,
        nickname,
        created_at
      `)

      if (profilesError) {
        throw profilesError
      }

      // ユーザーロールを取得
      const { data: userRoles, error: rolesError } = await supabase.from("user_roles").select(`
        user_id,
        is_admin
      `)

      if (rolesError) {
        throw rolesError
      }

      // ユーザープランを取得
      const { data: userPlans, error: plansDataError } = await supabase.from("user_plans").select(`
        user_id,
        plan_id,
        plans (
          id,
          name
        )
      `)

      if (plansDataError) {
        throw plansDataError
      }

      // データをマージしてユーザー情報を構築
      const formattedUsers = userProfiles.map((profile) => {
        // ユーザーの管理者権限を検索
        const userRole = userRoles?.find((role) => role.user_id === profile.user_id) || { is_admin: false }

        // ユーザーのプラン情報を検索
        const userPlan = userPlans?.find((plan) => plan.user_id === profile.user_id)

        return {
          id: profile.user_id,
          email: profile.nickname || "不明",
          created_at: profile.created_at,
          is_admin: userRole.is_admin || false,
          plan: userPlan?.plans || null,
        }
      })

      setUsers(formattedUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "エラーが発生しました",
        description: "ユーザー情報の取得中にエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus

      // user_rolesテーブルに既にレコードがあるか確認
      const { data: existingRole } = await supabase.from("user_roles").select().eq("user_id", userId).single()

      let error

      if (existingRole) {
        // 既存のレコードを更新
        const { error: updateError } = await supabase
          .from("user_roles")
          .update({ is_admin: newStatus })
          .eq("user_id", userId)

        error = updateError
      } else {
        // 新しいレコードを作成
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, is_admin: newStatus })

        error = insertError
      }

      if (error) {
        throw error
      }

      // ユーザーリストを更新
      setUsers(users.map((user) => (user.id === userId ? { ...user, is_admin: newStatus } : user)))

      toast({
        title: "更新しました",
        description: `ユーザーの管理者権限を${newStatus ? "付与" : "解除"}しました。`,
      })
    } catch (error) {
      console.error("Error toggling admin status:", error)
      toast({
        title: "エラーが発生しました",
        description: "管理者権限の更新中にエラーが発生しました。",
        variant: "destructive",
      })
    }
  }

  const updateUserPlan = async (userId: string, planId: string) => {
    try {
      // user_plansテーブルに既にレコードがあるか確認
      const { data: existingPlan } = await supabase.from("user_plans").select().eq("user_id", userId).single()

      let error

      if (existingPlan) {
        // 既存のレコードを更新
        const { error: updateError } = await supabase
          .from("user_plans")
          .update({ plan_id: planId, updated_at: new Date().toISOString() })
          .eq("user_id", userId)

        error = updateError
      } else {
        // 新しいレコードを作成
        const { error: insertError } = await supabase.from("user_plans").insert({ user_id: userId, plan_id: planId })

        error = insertError
      }

      if (error) {
        throw error
      }

      // プラン名を取得
      const planName = plans.find((p) => p.id === planId)?.name || planId

      // ユーザーリストを更新
      setUsers(users.map((user) => (user.id === userId ? { ...user, plan: { id: planId, name: planName } } : user)))

      toast({
        title: "更新しました",
        description: `ユーザーのプランを${planName}に変更しました。`,
      })
    } catch (error) {
      console.error("Error updating user plan:", error)
      toast({
        title: "エラーが発生しました",
        description: "プランの更新中にエラーが発生しました。",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div>ユーザー情報を読み込み中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">ユーザー管理</h2>
        <Button onClick={fetchUsers} variant="outline" size="sm">
          更新
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ユーザー名</TableHead>
              <TableHead>登録日</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>管理者権限</TableHead>
              <TableHead>プラン</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  ユーザーが見つかりません
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">アクティブ</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch checked={user.is_admin} onCheckedChange={() => toggleAdminStatus(user.id, user.is_admin)} />
                  </TableCell>
                  <TableCell>
                    <select
                      className="p-1 rounded border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      value={user.plan?.id || ""}
                      onChange={(e) => updateUserPlan(user.id, e.target.value)}
                    >
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
