export interface Article {
  id: string
  title: string
  content: string
  user_id: string
  created_at: string
  updated_at?: string | null
  access_level: "OPEN" | "FREE" | "BASIC" | "PRO" | "VIP"
}

export interface ArticleInput {
  title: string
  content: string
  access_level: "OPEN" | "FREE" | "BASIC" | "PRO" | "VIP"
}

export interface UserProfile {
  id: string
  user_id: string
  nickname: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface ProfileInput {
  nickname: string
  bio: string | null
  avatar_url?: string | null
}
