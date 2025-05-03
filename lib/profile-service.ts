import { supabase } from "./supabase"
import type { UserProfile, ProfileInput } from "./types"

// プロフィールキャッシュ
const profileCache: Record<string, { data: UserProfile; timestamp: number }> = {}
const CACHE_DURATION = 60000 // 1分間キャッシュを有効にする

// ユーザーIDでプロフィールを取得
export async function getProfileByUserId(userId: string): Promise<UserProfile | null> {
  // キャッシュが有効かチェック
  const now = Date.now()
  if (profileCache[userId] && now - profileCache[userId].timestamp < CACHE_DURATION) {
    return profileCache[userId].data
  }

  const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", userId).single()

  if (error) {
    console.error(`Error fetching profile for user ${userId}:`, error)
    return null
  }

  // キャッシュを更新
  if (data) {
    profileCache[userId] = {
      data,
      timestamp: now,
    }
  }

  return data
}

// 現在のユーザーのプロフィールを取得
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return getProfileByUserId(user.id)
}

// プロフィールを更新
export async function updateProfile(profileInput: ProfileInput): Promise<UserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("ユーザーが認証されていません")
  }

  // avatar_urlがundefinedの場合はnullに変換
  const avatar_url = profileInput.avatar_url === undefined ? null : profileInput.avatar_url

  const updates = {
    nickname: profileInput.nickname,
    bio: profileInput.bio,
    avatar_url: avatar_url,
    updated_at: new Date().toISOString(),
  }

  console.log("Updating profile with data:", updates)

  // まず既存のプロフィールを確認
  const { data: existingProfile } = await supabase.from("user_profiles").select("id").eq("user_id", user.id).single()

  let result

  if (existingProfile) {
    // 既存のプロフィールがある場合は更新
    const { data, error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating profile:", error)
      throw error
    }

    result = data
  } else {
    // プロフィールがない場合は新規作成
    const { data, error } = await supabase
      .from("user_profiles")
      .insert({
        ...updates,
        user_id: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating profile:", error)
      throw error
    }

    result = data
  }

  // キャッシュを更新
  if (result) {
    profileCache[user.id] = {
      data: result,
      timestamp: Date.now(),
    }
  }

  console.log("Profile updated successfully:", result)
  return result
}

// アバター画像をアップロード
export async function uploadAvatar(file: File): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("ユーザーが認証されていません")
  }

  // ファイルサイズチェック（10MB制限）
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("ファイルサイズは10MB以下にしてください")
  }

  try {
    // 画像を圧縮
    const compressedFile = await compressImage(file)

    // ファイル名を生成
    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `${fileName}`

    console.log("Attempting to upload avatar:", filePath)

    // バケットの存在確認をスキップして直接アップロードを試みる
    const { error: uploadError, data } = await supabase.storage.from("avatars").upload(filePath, compressedFile, {
      cacheControl: "3600",
      upsert: true,
    })

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError)

      // バケットが存在しない場合のエラーメッセージをより明確に
      if (uploadError.message && uploadError.message.includes("bucket") && uploadError.message.includes("not found")) {
        throw new Error("アバターストレージが利用できません。管理者に連絡してください。")
      }

      throw uploadError
    }

    // 公開URLを取得
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath)

    console.log("Avatar uploaded successfully, URL:", urlData.publicUrl)
    return urlData.publicUrl
  } catch (error) {
    console.error("Error in uploadAvatar:", error)
    throw error
  }
}

// 画像圧縮関数
async function compressImage(file: File): Promise<File> {
  // 画像ファイルでない場合はそのまま返す
  if (!file.type.startsWith("image/")) {
    return file
  }

  // 画像サイズが小さい場合はそのまま返す
  if (file.size < 1024 * 1024) {
    // 1MB未満
    return file
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(img.src)

      // 最大サイズを設定
      const MAX_WIDTH = 800
      const MAX_HEIGHT = 800

      let width = img.width
      let height = img.height

      // アスペクト比を維持しながらサイズを縮小
      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width
          width = MAX_WIDTH
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height
          height = MAX_HEIGHT
        }
      }

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas context not available"))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // 画質を調整して圧縮
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"))
            return
          }

          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          })

          resolve(compressedFile)
        },
        file.type,
        0.7, // 画質 (0.7 = 70%)
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error("Failed to load image"))
    }
  })
}

// アバター画像を削除
export async function deleteAvatar(avatarUrl: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("ユーザーが認証されていません")
  }

  try {
    // URLからファイル名を抽出
    const fileName = avatarUrl.split("/").pop()

    if (!fileName) {
      throw new Error("無効なアバターURLです")
    }

    console.log("Attempting to delete avatar:", fileName)

    const { error } = await supabase.storage.from("avatars").remove([fileName])

    if (error) {
      console.error("Error deleting avatar:", error)
      throw error
    }

    console.log("Avatar deleted successfully")
  } catch (error) {
    console.error("Error in deleteAvatar:", error)
    throw error
  }
}
