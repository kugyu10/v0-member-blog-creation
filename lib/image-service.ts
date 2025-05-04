import { supabase } from "./supabase"

// 画像をアップロードする関数
export async function uploadImage(file: File): Promise<string | null> {
  try {
    // ファイルサイズチェック（10MB制限）
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("ファイルサイズは10MB以下にしてください")
    }

    // ファイルタイプチェック
    if (!file.type.startsWith("image/")) {
      throw new Error("画像ファイルを選択してください")
    }

    // ファイル名を生成
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `${fileName}`

    console.log("Attempting to upload image:", filePath)

    // バケットの存在確認をスキップして直接アップロードを試みる
    const { error: uploadError, data } = await supabase.storage.from("images").upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    })

    if (uploadError) {
      console.error("Error uploading image:", uploadError)

      // バケットが存在しない場合のエラーメッセージをより明確に
      if (uploadError.message && uploadError.message.includes("bucket") && uploadError.message.includes("not found")) {
        throw new Error("画像ストレージが利用できません。管理者に連絡してください。")
      }

      throw uploadError
    }

    // 公開URLを取得
    const { data: urlData } = supabase.storage.from("images").getPublicUrl(filePath)

    console.log("Image uploaded successfully, URL:", urlData.publicUrl)
    return urlData.publicUrl
  } catch (error) {
    console.error("Error in uploadImage:", error)
    throw error
  }
}

// 画像URLが有効かチェックする関数
export async function isValidImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" })
    const contentType = response.headers.get("content-type")
    return response.ok && contentType !== null && contentType.startsWith("image/")
  } catch (error) {
    console.error("Error validating image URL:", error)
    return false
  }
}
