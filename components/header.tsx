"use client"

import { useState, useEffect, useCallback, memo } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings, Crown, UserCircle, PlusCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getCurrentUserProfile } from "@/lib/profile-service"
import type { UserProfile } from "@/lib/types"

// プロフィールキャッシュ
let profileCache: {
  data: UserProfile | null
  timestamp: number
} = {
  data: null,
  timestamp: 0,
}

const CACHE_DURATION = 60000 // 1分間キャッシュを有効にする

// メモ化したユーザーメニュー
const UserMenu = memo(function UserMenu({
  user,
  profile,
  userPlan,
  isAdmin,
  canCreateArticle,
  signOut,
}: {
  user: any
  profile: UserProfile | null
  userPlan: any
  isAdmin: boolean
  canCreateArticle: boolean
  signOut: () => Promise<void>
}) {
  // キャッシュバスティング用のタイムスタンプ
  const avatarUrlWithTimestamp = profile?.avatar_url
    ? `${profile.avatar_url}${profile.avatar_url.includes("?") ? "&" : "?"}t=${Date.now()}`
    : null

  return (
    <div className="flex items-center gap-2">
      {canCreateArticle && (
        <Link href="/articles/new">
          <Button variant="outline" size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            新規記事作成
          </Button>
        </Link>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            {profile?.avatar_url ? (
              <Avatar className="h-6 w-6">
                <AvatarImage src={avatarUrlWithTimestamp || ""} alt={profile.nickname || ""} />
                <AvatarFallback>{profile?.nickname?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            ) : (
              <User className="h-4 w-4" />
            )}
            {profile?.nickname || (user?.email ? user.email.split("@")[0] : "ユーザー")}
            {userPlan && (
              <Badge variant="outline" className="ml-1 font-normal">
                <Crown className="h-3 w-3 mr-1 text-yellow-500" />
                {userPlan.name}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Link href="/profile">
            <DropdownMenuItem>
              <UserCircle className="h-4 w-4 mr-2" />
              プロフィール設定
            </DropdownMenuItem>
          </Link>
          {isAdmin && (
            <>
              <Link href="/admin">
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  管理画面
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => signOut()} className="text-red-500 cursor-pointer">
            <LogOut className="h-4 w-4 mr-2" />
            ログアウト
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
})

UserMenu.displayName = "UserMenu"

export default function Header() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const { user, signOut, isLoading, isAdmin, userPlan } = useAuth()

  // BASIC以上のプランを持っているか、または管理者かをチェック
  const canCreateArticle = isAdmin || (userPlan && ["BASIC", "PRO", "VIP"].includes(userPlan?.name))

  // プロフィール読み込み関数をメモ化
  const loadProfile = useCallback(async () => {
    if (!user || profileLoading) return

    try {
      setProfileLoading(true)
      // まずキャッシュをチェック
      const now = Date.now()
      if (profileCache.data && now - profileCache.timestamp < CACHE_DURATION) {
        setProfile(profileCache.data)
        setProfileLoading(false)
        return
      }

      const userProfile = await getCurrentUserProfile()

      if (userProfile) {
        setProfile(userProfile)

        // キャッシュを更新
        profileCache = {
          data: userProfile,
          timestamp: now,
        }
      }
    } catch (err) {
      console.error("Error loading profile in header:", err)
    } finally {
      setProfileLoading(false)
    }
  }, [user, profileLoading])

  // userが変更されたときだけプロフィールを読み込む
  useEffect(() => {
    if (user) {
      loadProfile()
    } else {
      setProfile(null)
    }
  }, [user, loadProfile])

  return (
    <header className="border-b">
      <div className="container mx-auto py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          会員制ブログシステム
        </Link>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="h-9 w-24 bg-muted animate-pulse rounded-md"></div>
          ) : user ? (
            <div className="flex items-center gap-4">
              <Link href="/articles">
                <Button variant="ghost" size="sm">
                  記事一覧
                </Button>
              </Link>
              <UserMenu
                user={user}
                profile={profile}
                userPlan={userPlan}
                isAdmin={isAdmin}
                canCreateArticle={canCreateArticle}
                signOut={signOut}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/articles">
                <Button variant="ghost" size="sm">
                  記事一覧
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  ログイン
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">会員登録</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
