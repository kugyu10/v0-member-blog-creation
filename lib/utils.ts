import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

// マークダウンテキストからプレーンテキストを抽出する関数
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/#+\s+(.*)/g, "$1") // 見出し
    .replace(/\*\*(.*?)\*\*/g, "$1") // 太字
    .replace(/\*(.*?)\*/g, "$1") // 斜体
    .replace(/\[(.*?)\]$$.*?$$/g, "$1") // リンク
    .replace(/!\[(.*?)\]$$.*?$$/g, "$1") // 画像
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1") // コード
    .replace(/~~(.*?)~~/g, "$1") // 取り消し線
    .replace(/>\s+(.*)/g, "$1") // 引用
    .replace(/\n+/g, " ") // 改行を空白に
    .replace(/\s+/g, " ") // 複数の空白を1つに
    .trim() // 前後の空白を削除
}
