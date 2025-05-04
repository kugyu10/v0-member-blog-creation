import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// 環境変数が存在するか確認し、デフォルト値を設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// クライアントサイドでのみ実行されるようにする
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const supabase = (() => {
  if (typeof window === "undefined") {
    // サーバーサイドでは新しいインスタンスを作成
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // サーバーサイドではセッションを永続化しない
      },
    })
  }

  // クライアントサイドではシングルトンパターンを使用
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true, // クライアントサイドではセッションを永続化
        storageKey: "supabase_auth_token",
        storage: {
          getItem: (key) => {
            try {
              return localStorage.getItem(key)
            } catch (error) {
              console.error("Error accessing localStorage:", error)
              return null
            }
          },
          setItem: (key, value) => {
            try {
              localStorage.setItem(key, value)
            } catch (error) {
              console.error("Error accessing localStorage:", error)
            }
          },
          removeItem: (key) => {
            try {
              localStorage.removeItem(key)
            } catch (error) {
              console.error("Error accessing localStorage:", error)
            }
          },
        },
      },
    })
  }

  return supabaseInstance
})()
