import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  // 特殊なパスのリダイレクト（最優先で処理）
  if (req.nextUrl.pathname === "/articles/_new") {
    return NextResponse.redirect(new URL("/articles/new", req.url))
  }

  // 特殊なIDのリダイレクト（正規表現でマッチング）
  const articleIdMatch = req.nextUrl.pathname.match(/^\/articles\/(_new|new)(?:\/|$)/)
  if (articleIdMatch && articleIdMatch[1] && articleIdMatch[1] !== "new") {
    return NextResponse.redirect(new URL("/articles/new", req.url))
  }

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // セッションを取得
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 認証が必要なルートのパス
  const authRequiredPaths = ["/articles/new", "/articles/[id]/edit"]

  // 管理者権限が必要なルートのパス
  const adminRequiredPaths = ["/admin", "/admin/users"]

  // 現在のパスが認証を必要とするかチェック
  const requiresAuth = authRequiredPaths.some((path) => {
    // 動的ルートの場合はパターンマッチング
    if (path.includes("[id]")) {
      const pattern = path.replace("[id]", "[^/]+")
      const regex = new RegExp(`^${pattern}$`)
      return regex.test(req.nextUrl.pathname)
    }
    return path === req.nextUrl.pathname
  })

  // 現在のパスが管理者権限を必要とするかチェック
  const requiresAdmin = adminRequiredPaths.some((path) => {
    return req.nextUrl.pathname.startsWith(path)
  })

  // 認証が必要なルートでセッションがない場合はログインページにリダイレクト
  if (requiresAuth && !session) {
    const redirectUrl = new URL("/login", req.url)
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 管理者権限が必要なルートの場合は、管理者かどうかをチェック
  if (requiresAdmin) {
    if (!session) {
      // セッションがない場合はログインページにリダイレクト
      const redirectUrl = new URL("/login", req.url)
      redirectUrl.searchParams.set("redirect", req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // ユーザーが管理者かどうかをチェック
    const { data } = await supabase.from("user_roles").select("is_admin").eq("user_id", session.user.id).single()

    // 管理者でない場合はホームページにリダイレクト
    if (!data?.is_admin) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  // ログイン済みユーザーがログインページや登録ページにアクセスした場合はホームにリダイレクト
  if (session && (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/register")) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return res
}

// ミドルウェアを適用するパス
export const config = {
  matcher: ["/", "/login", "/register", "/articles/:path*", "/admin/:path*"],
}
