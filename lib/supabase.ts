import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// 環境変数が存在するか確認し、デフォルト値を設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// 環境変数が設定されているかチェック
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase環境変数が設定されていません。必要な環境変数を確認してください。")
}

// クライアントサイドでのみ実行されるようにする
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const supabase = (() => {
  try {
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
                console.error("ローカルストレージへのアクセスエラー:", error)
                return null
              }
            },
            setItem: (key, value) => {
              try {
                localStorage.setItem(key, value)
              } catch (error) {
                console.error("ローカルストレージへのアクセスエラー:", error)
              }
            },
            removeItem: (key) => {
              try {
                localStorage.removeItem(key)
              } catch (error) {
                console.error("ローカルストレージへのアクセスエラー:", error)
              }
            },
          },
        },
      })
    }

    return supabaseInstance
  } catch (error) {
    console.error("Supabaseクライアントの初期化に失敗しました:", error)

    // エラーが発生した場合でも、最低限機能するダミークライアントを返す
    return createClient<Database>(supabaseUrl || "https://example.com", supabaseAnonKey || "dummy-key", {
      auth: {
        persistSession: false,
      },
    })
  }
})()

// 接続テスト用の関数
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from("articles").select("count", { count: "exact", head: true })
    return !error
  } catch (e) {
    console.error("Supabase接続テストに失敗しました:", e)
    return false
  }
}
