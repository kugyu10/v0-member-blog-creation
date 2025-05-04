"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle, Lock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function NewArticleButton() {
  const { user, userPlan, isAdmin } = useAuth()

  // ユーザーがログインしていない場合
  if (!user) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button disabled>
              <PlusCircle className="mr-2 h-4 w-4" />
              新規記事作成
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>記事を作成するにはログインしてください</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // プランがBASIC以上または管理者の場合
  const canCreateArticle = isAdmin || (userPlan && ["BASIC", "PRO", "VIP"].includes(userPlan.name))

  if (canCreateArticle) {
    return (
      <Link href="/articles/_new">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          新規記事作成
        </Button>
      </Link>
    )
  }

  // FREEプランの場合
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" disabled>
            <Lock className="mr-2 h-4 w-4" />
            新規記事作成
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>記事を作成するにはBASIC以上のプランが必要です</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
