"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Crown } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Plan {
  id: string
  name: string
  description: string | null
}

// プランの順序を定義
const PLAN_ORDER = ["FREE", "BASIC", "PRO", "VIP"]

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const { userPlan, isAdmin } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchPlans() {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("plans").select("*")

        if (error) {
          throw error
        }

        // プランを指定した順序でソート
        const sortedPlans = [...(data || [])].sort((a, b) => {
          const indexA = PLAN_ORDER.indexOf(a.name)
          const indexB = PLAN_ORDER.indexOf(b.name)
          return indexA - indexB
        })

        setPlans(sortedPlans)
      } catch (err) {
        console.error("Error fetching plans:", err)
        toast({
          title: "エラーが発生しました",
          description: "プラン情報の取得中にエラーが発生しました。",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [toast])

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p>読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">プラン一覧</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          あなたに最適なプランをお選びください。より高いプランでは、より多くの記事にアクセスできます。
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrentPlan = userPlan?.name === plan.name
          const isPremiumPlan = plan.name !== "FREE"

          return (
            <Card key={plan.id} className={`flex flex-col ${isCurrentPlan ? "border-primary bg-primary/5" : ""}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center">
                    {plan.name}
                    {plan.name === "VIP" && <Crown className="ml-2 h-4 w-4 text-yellow-500" />}
                  </CardTitle>
                  {isCurrentPlan && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                      現在のプラン
                    </span>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    <span>FREEレベルの記事</span>
                  </li>
                  {(plan.name === "BASIC" || plan.name === "PRO" || plan.name === "VIP") && (
                    <>
                      <li className="flex items-center">
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        <span>BASICレベルの記事</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        <span>記事の作成</span>
                      </li>
                    </>
                  )}
                  {(plan.name === "PRO" || plan.name === "VIP") && (
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      <span>PROレベルの記事</span>
                    </li>
                  )}
                  {plan.name === "VIP" && (
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      <span>VIPレベルの記事</span>
                    </li>
                  )}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={isCurrentPlan ? "outline" : isPremiumPlan ? "default" : "secondary"}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? "現在のプラン" : "アップグレード"}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>
          ※実際のアップグレード機能は実装されていません。管理者画面からユーザーのプランを変更できます。
          {isAdmin && " (管理者としてログインしています)"}
        </p>
      </div>
    </div>
  )
}
