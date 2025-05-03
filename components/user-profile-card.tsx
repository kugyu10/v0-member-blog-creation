import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown } from "lucide-react"
import type { UserProfile } from "@/lib/types"

interface UserProfileCardProps {
  profile: UserProfile
  planName?: string | null
}

export default function UserProfileCard({ profile, planName }: UserProfileCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.avatar_url || ""} alt={profile.nickname || ""} />
          <AvatarFallback className="text-lg">{profile.nickname?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="flex items-center gap-2">
            {profile.nickname || "ユーザー"}
            {planName && (
              <Badge variant="outline" className="ml-1 font-normal">
                <Crown className="h-3 w-3 mr-1 text-yellow-500" />
                {planName}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>{new Date(profile.created_at).toLocaleDateString("ja-JP")}から登録</CardDescription>
        </div>
      </CardHeader>
      {profile.bio && (
        <CardContent>
          <p className="whitespace-pre-wrap">{profile.bio}</p>
        </CardContent>
      )}
    </Card>
  )
}
