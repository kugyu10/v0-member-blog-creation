export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      articles: {
        Row: {
          id: string
          title: string
          content: string
          created_at: string
          updated_at: string | null
          user_id: string | null
          access_level: "FREE" | "BASIC" | "PRO" | "VIP"
        }
        Insert: {
          id?: string
          title: string
          content: string
          created_at?: string
          updated_at?: string | null
          user_id?: string | null
          access_level?: "FREE" | "BASIC" | "PRO" | "VIP"
        }
        Update: {
          id?: string
          title?: string
          content?: string
          created_at?: string
          updated_at?: string | null
          user_id?: string | null
          access_level?: "FREE" | "BASIC" | "PRO" | "VIP"
        }
      }
      plans: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_plans: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          start_date: string
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          start_date?: string
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          start_date?: string
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          nickname: string | null
          bio: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nickname?: string | null
          bio?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nickname?: string | null
          bio?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
