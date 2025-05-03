import { v4 as uuidv4 } from "uuid"
import { supabase } from "./supabase"
import type { Article, ArticleInput } from "./types"

// キャッシュ用の変数
let articlesCache: {
  data: Article[] | null
  timestamp: number
} = {
  data: null,
  timestamp: 0,
}

const CACHE_DURATION = 60000 // 1分間キャッシュを有効にする

// すべての記事を取得（キャッシュ対応）
export async function getArticles(): Promise<Article[]> {
  try {
    // 現在のユーザーを取得
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // 未認証の場合は空の配列を返す
      return []
    }

    // キャッシュが有効かチェック
    const now = Date.now()
    if (articlesCache.data && now - articlesCache.timestamp < CACHE_DURATION) {
      return articlesCache.data
    }

    // 最適化されたクエリ - 必要な列のみを選択
    const { data, error } = await supabase
      .from("articles")
      .select("id, title, content, created_at, updated_at, user_id, access_level")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching articles:", error)
      throw error
    }

    // キャッシュを更新
    articlesCache = {
      data: data || [],
      timestamp: now,
    }

    return data || []
  } catch (error) {
    console.error("Error in getArticles:", error)
    throw error
  }
}

// キャッシュをクリア
export function clearArticlesCache() {
  articlesCache = {
    data: null,
    timestamp: 0,
  }
}

// IDで記事を取得（個別キャッシュ）
const articleCache: Record<string, { data: Article; timestamp: number }> = {}

export async function getArticleById(id: string): Promise<Article | null> {
  try {
    // キャッシュが有効かチェック
    const now = Date.now()
    if (articleCache[id] && now - articleCache[id].timestamp < CACHE_DURATION) {
      return articleCache[id].data
    }

    const { data, error } = await supabase.from("articles").select("*").eq("id", id).single()

    if (error) {
      console.error(`Error fetching article with id ${id}:`, error)
      return null
    }

    // キャッシュを更新
    if (data) {
      articleCache[id] = {
        data,
        timestamp: now,
      }
    }

    return data
  } catch (error) {
    console.error(`Error in getArticleById with id ${id}:`, error)
    return null
  }
}

// 記事を作成
export async function createArticle(articleInput: ArticleInput): Promise<Article> {
  try {
    // 現在のユーザーを取得
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("ユーザーが認証されていません")
    }

    const newArticle = {
      id: uuidv4(),
      title: articleInput.title,
      content: articleInput.content,
      user_id: user.id,
      access_level: articleInput.access_level || "FREE", // デフォルトはFREE
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("articles").insert(newArticle).select().single()

    if (error) {
      console.error("Error creating article:", error)
      throw error
    }

    // キャッシュをクリア
    clearArticlesCache()

    return data
  } catch (error) {
    console.error("Error in createArticle:", error)
    throw error
  }
}

// 記事を更新
export async function updateArticle(id: string, articleInput: ArticleInput): Promise<Article | null> {
  try {
    // 現在のユーザーを取得
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("ユーザーが認証されていません")
    }

    const updateData = {
      title: articleInput.title,
      content: articleInput.content,
      access_level: articleInput.access_level,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("articles").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error(`Error updating article with id ${id}:`, error)
      throw error
    }

    // キャッシュを更新
    if (data) {
      articleCache[id] = {
        data,
        timestamp: Date.now(),
      }
      clearArticlesCache() // 一覧のキャッシュもクリア
    }

    return data
  } catch (error) {
    console.error(`Error in updateArticle with id ${id}:`, error)
    throw error
  }
}

// 記事を削除
export async function deleteArticle(id: string): Promise<boolean> {
  try {
    // 現在のユーザーを取得
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("ユーザーが認証されていません")
    }

    const { error } = await supabase.from("articles").delete().eq("id", id)

    if (error) {
      console.error(`Error deleting article with id ${id}:`, error)
      throw error
    }

    // キャッシュから削除
    delete articleCache[id]
    clearArticlesCache() // 一覧のキャッシュもクリア

    return true
  } catch (error) {
    console.error(`Error in deleteArticle with id ${id}:`, error)
    throw error
  }
}

// ユーザーの記事を取得
export async function getUserArticles(): Promise<Article[]> {
  try {
    // 現在のユーザーを取得
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("ユーザーが認証されていません")
    }

    const { data, error } = await supabase
      .from("articles")
      .select("id, title, content, created_at, updated_at, user_id, access_level")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user articles:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error in getUserArticles:", error)
    throw error
  }
}

// 記事のアクセスレベルを確認
export async function checkArticleAccess(articleId: string): Promise<boolean> {
  try {
    const article = await getArticleById(articleId)

    // 記事が存在しない場合
    if (!article) {
      return false
    }

    // 記事が取得できれば、RLSによってアクセス権があると判断
    return true
  } catch (error) {
    console.error("Error checking article access:", error)
    return false
  }
}
