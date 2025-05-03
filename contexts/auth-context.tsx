"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

// TypeScriptの型定義
type PlanInfo = {
  id: string
  name: string
  description: string | null
}

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAdmin: boolean
  userPlan: PlanInfo | null
  signUp: (
    email: string,
    password: string,
  ) => Promise<{
    error: any | null
    success: boolean
  }>
  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    error: any | null
    success: boolean
  }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ユーザー情報をローカルストレージにキャッシュするためのキー
const USER_CACHE_KEY = "user_cache"
const ADMIN_CACHE_KEY = "admin_cache"
const PLAN_CACHE_KEY = "plan_cache"
const CACHE_EXPIRY = 1000 * 60 * 5 // 5分間キャッシュを有効にする

// キャッシュからデータを取得する関数
function getFromCache<T>(key: string): { data: T | null; expired: boolean } {
  try {
    if (typeof window === "undefined") {
      return { data: null, expired: true }
    }

    const cached = localStorage.getItem(key)
    if (!cached) return { data: null, expired: true }

    const { data, timestamp } = JSON.parse(cached)
    const expired = Date.now() - timestamp > CACHE_EXPIRY

    return { data: expired ? null : data, expired }
  } catch (e) {
    return { data: null, expired: true }
  }
}

// キャッシュにデータを保存する関数
function saveToCache<T>(key: string, data: T): void {
  try {
    if (typeof window === "undefined") return

    localStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    )
  } catch (e) {
    console.error("Failed to save to cache:", e)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userPlan, setUserPlan] = useState<PlanInfo | null>(null)
  const router = useRouter()

  // ユーザーが管理者かどうかをチェック - 最適化版
  const checkAdminStatus = useCallback(async (user: User | null) => {
    if (!user) {
      setIsAdmin(false)
      return
    }

    try {
      // まずキャッシュをチェック
      const { data: cachedAdmin, expired } = getFromCache<boolean>(ADMIN_CACHE_KEY)

      if (cachedAdmin !== null && !expired) {
        setIsAdmin(cachedAdmin)
        return
      }

      // キャッシュがない場合はAPIを呼び出す
      const { data, error } = await supabase.rpc("is_admin", {
        user_id_param: user.id,
      })

      if (error) {
        console.error("Error checking admin status:", error)
        setIsAdmin(false)
        return
      }

      const isAdminValue = data || false
      setIsAdmin(isAdminValue)

      // キャッシュに保存
      saveToCache(ADMIN_CACHE_KEY, isAdminValue)
    } catch (error) {
      console.error("Error checking admin status:", error)
      setIsAdmin(false)
    }
  }, [])

  // ユーザーのプラン情報を取得 - 最適化版
  const getUserPlanInfo = useCallback(async (user: User | null) => {
    if (!user) {
      setUserPlan(null)
      return
    }

    try {
      // まずキャッシュをチェック
      const { data: cachedPlan, expired } = getFromCache<PlanInfo>(PLAN_CACHE_KEY)

      if (cachedPlan !== null && !expired) {
        setUserPlan(cachedPlan)
        return
      }

      // キャッシュがない場合はAPIを呼び出す
      const { data, error } = await supabase.rpc("get_user_plan", {
        user_id_param: user.id,
      })

      if (error) {
        console.error("Error fetching user plan:", error)
        setUserPlan(null)
        return
      }

      if (data && data.length > 0) {
        const planInfo = {
          id: data[0].plan_id,
          name: data[0].plan_name,
          description: data[0].plan_description,
        }
        setUserPlan(planInfo)

        // キャッシュに保存
        saveToCache(PLAN_CACHE_KEY, planInfo)
      } else {
        setUserPlan(null)
      }
    } catch (error) {
      console.error("Error fetching user plan:", error)
      setUserPlan(null)
    }
  }, [])

  useEffect(() => {
    // セッションの初期化
    const initSession = async () => {
      setIsLoading(true)

      try {
        // まずキャッシュをチェック
        const { data: cachedUser, expired } = getFromCache<User>(USER_CACHE_KEY)

        if (cachedUser && !expired) {
          setUser(cachedUser)
          // キャッシュからユーザー情報を取得した場合でも、バックグラウンドで最新のセッションを確認
          const {
            data: { session },
          } = await supabase.auth.getSession()
          if (session) {
            setSession(session)
            setUser(session.user)
            saveToCache(USER_CACHE_KEY, session.user)
          }
        } else {
          // キャッシュがない場合は通常のセッション取得
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession()

          if (error) {
            console.error("Error getting session:", error)
          }

          setSession(session)
          setUser(session?.user || null)

          if (session?.user) {
            saveToCache(USER_CACHE_KEY, session.user)
          }
        }

        // 管理者ステータスとプラン情報を並行して取得
        if (user) {
          await Promise.all([checkAdminStatus(user), getUserPlanInfo(user)])
        }
      } catch (error) {
        console.error("Error initializing session:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initSession()

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user || null)

      if (session?.user) {
        saveToCache(USER_CACHE_KEY, session.user)

        // 管理者ステータスとプラン情報を並行して取得
        await Promise.all([checkAdminStatus(session.user), getUserPlanInfo(session.user)])
      } else {
        // ログアウト時にキャッシュをクリア
        try {
          if (typeof window !== "undefined") {
            localStorage.removeItem(USER_CACHE_KEY)
            localStorage.removeItem(ADMIN_CACHE_KEY)
            localStorage.removeItem(PLAN_CACHE_KEY)
          }
        } catch (e) {
          console.error("Failed to clear cache:", e)
        }

        setIsAdmin(false)
        setUserPlan(null)
      }

      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [checkAdminStatus, getUserPlanInfo, user])

  // 新規ユーザー登録
  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return { error, success: false }
      }

      return { error: null, success: true }
    } catch (error) {
      console.error("Error signing up:", error)
      return { error, success: false }
    }
  }, [])

  // ログイン
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          return { error, success: false }
        }

        router.push("/")
        return { error: null, success: true }
      } catch (error) {
        console.error("Error signing in:", error)
        return { error, success: false }
      }
    },
    [router],
  )

  // ログアウト
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()

      // キャッシュをクリア
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem(USER_CACHE_KEY)
          localStorage.removeItem(ADMIN_CACHE_KEY)
          localStorage.removeItem(PLAN_CACHE_KEY)
        }
      } catch (e) {
        console.error("Failed to clear cache:", e)
      }

      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }, [router])

  // コンテキスト値をメモ化
  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      isAdmin,
      userPlan,
      signUp,
      signIn,
      signOut,
    }),
    [user, session, isLoading, isAdmin, userPlan, signUp, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
