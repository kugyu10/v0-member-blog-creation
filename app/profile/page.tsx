"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import AvatarUpload from "@/components/avatar-upload"
import { getCurrentUserProfile, updateProfile } from "@/lib/profile-service"
import type { UserProfile } from "@/lib/types"

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [nickname, setNickname] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function loadProfile() {
      if (!user) return

      try {
        setIsLoading(true)
        const userProfile = await getCurrentUserProfile()

        if (userProfile) {
          setProfile(userProfile)
          setNickname(userProfile.nickname || "")
          setBio(userProfile.bio || "")
          setAvatarUrl(userProfile.avatar_url)
        }
      } catch (err) {
        console.error("Error loading profile:", err)
        setError("プロフィールの読み込み中にエラーが発生しました")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!nickname.trim()) {
      setError("ニックネームを入力してください")
      return
    }

    if (bio && bio.length > 200) {
      setError("プロフィールは200文字以内で入力してください")
      return
    }

    try {
      setIsSaving(true)

      console.log("Updating profile with avatar_url:", avatarUrl)

      const updatedProfile = await updateProfile({
        nickname,
        bio,
        avatar_url: avatarUrl,
      })

      if (updatedProfile) {
        setProfile(updatedProfile)
        toast({
          title: "プロフィールを更新しました",
          description: "プロフィール情報が正常に更新されました。",
        })
      }
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("プロフィールの更新中にエラーが発生しました")
    } finally {
      setIsSaving(false)
    }
  }

  // アバターが変更されたときに即座にプロフィールを更新
  const handleAvatarChange = async (url: string | null) => {
    setAvatarUrl(url)

    // アバターが変更されたら即座にプロフィールを更新
    try {
      console.log("Avatar changed, updating profile with new avatar_url:", url)

      const updatedProfile = await updateProfile({
        nickname: nickname || profile?.nickname || "",
        bio: bio || profile?.bio || "",
        avatar_url: url,
      })

      if (updatedProfile) {
        setProfile(updatedProfile)
        toast({
          title: "アバターを更新しました",
          description: "プロフィール画像が正常に更新されました。",
        })
      }
    } catch (err) {
      console.error("Error updating profile with new avatar:", err)
      toast({
        title: "エラー",
        description: "プロフィール画像の更新中にエラーが発生しました。",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center">
          <p>読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>プロフィール設定</CardTitle>
            <CardDescription>あなたのプロフィール情報を設定してください</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <AvatarUpload currentAvatarUrl={avatarUrl} onAvatarChange={handleAvatarChange} />
                </div>

                <div className="flex-grow space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nickname">ニックネーム</Label>
                    <Input
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="ニックネームを入力"
                      maxLength={30}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">プロフィール</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="自己紹介を入力（200文字以内）"
                      maxLength={200}
                      rows={5}
                    />
                    <p className="text-xs text-right text-muted-foreground">{bio ? bio.length : 0}/200</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "保存中..." : "プロフィールを保存"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
