import { supabase } from "./supabaseClient"
import type { Article } from "../types/types"

// RPC関数を使用した代替実装（必要に応じて使用）
export async function getArticlesWithRPC(): Promise<Article[]> {
  try {
    // 現在のユーザーを取得
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    // RPC関数を使用して記事を取得
    const { data, error } = await supabase.rpc("get_articles_for_user", {
      user_id_param: user.id,
    })

    if (error) {
      console.error("Error fetching articles with RPC:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error in getArticlesWithRPC:", error)
    throw error
  }
}
