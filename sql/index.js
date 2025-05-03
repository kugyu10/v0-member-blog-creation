/**
 * データベース初期化スクリプト
 *
 * このスクリプトは、Supabaseデータベースの初期化に必要なすべてのスクリプトを
 * 適切な順序で実行するためのエントリーポイントです。
 *
 * 使用方法:
 * 1. 環境変数を設定: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * 2. `node sql/index.js` を実行
 */

const { createClient } = require("@supabase/supabase-js")
const fs = require("fs")
const path = require("path")

// Supabaseクライアントの初期化
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("環境変数 SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 実行するスクリプトの順序
const SCRIPTS_ORDER = [
  // テーブル作成
  { path: "./tables/create-user-profiles.sql", type: "sql" },
  { path: "./tables/add-user-id-to-articles.sql", type: "sql" },
  { path: "./tables/add-article-access-level.sql", type: "sql" },

  // スクリプト実行
  { path: "./scripts/create-user-roles-table.js", type: "js" },
  { path: "./scripts/create-plans-tables.js", type: "js" },
  { path: "./scripts/create-user-profiles.js", type: "js" },

  // 関数作成
  { path: "./functions/is_admin_function.sql", type: "sql" },
  { path: "./functions/get_user_plan_function.sql", type: "sql" },
  { path: "./functions/get_accessible_articles_function.sql", type: "sql" },
  { path: "./functions/create_get_articles_function.sql", type: "sql" },

  // ポリシー設定
  { path: "./policies/fix_user_roles_policy.sql", type: "sql" },
  { path: "./policies/fix_user_plans_policy.sql", type: "sql" },
  { path: "./policies/fix_plans_policy.sql", type: "sql" },
  { path: "./policies/fix_articles_rls_policy.sql", type: "sql" },
  { path: "./policies/restrict_article_creation.sql", type: "sql" },

  // ストレージ設定
  { path: "./storage/create_avatars_bucket_simple.sql", type: "sql" },
  { path: "./storage/fix_avatars_bucket_policy_v2.sql", type: "sql" },

  // 最終修正
  { path: "./migrations/comprehensive-fix-registration.sql", type: "sql" },
]

/**
 * SQLファイルを実行する関数
 */
async function executeSqlFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath)
    const sql = fs.readFileSync(fullPath, "utf8")

    console.log(`実行中: ${filePath}`)
    const { error } = await supabase.sql(sql)

    if (error) {
      console.error(`エラー (${filePath}):`, error)
      return false
    }

    console.log(`成功: ${filePath}`)
    return true
  } catch (err) {
    console.error(`予期せぬエラー (${filePath}):`, err)
    return false
  }
}

/**
 * JavaScriptファイルを実行する関数
 */
async function executeJsFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath)
    console.log(`実行中: ${filePath}`)

    // スクリプトをrequireして実行
    const script = require(fullPath)
    if (typeof script === "function") {
      await script(supabase)
    }

    console.log(`成功: ${filePath}`)
    return true
  } catch (err) {
    console.error(`予期せぬエラー (${filePath}):`, err)
    return false
  }
}

/**
 * メイン実行関数
 */
async function main() {
  console.log("データベース初期化を開始します...")

  for (const script of SCRIPTS_ORDER) {
    let success = false

    if (script.type === "sql") {
      success = await executeSqlFile(script.path)
    } else if (script.type === "js") {
      success = await executeJsFile(script.path)
    }

    if (!success) {
      console.error(`スクリプト ${script.path} の実行に失敗しました。処理を中断します。`)
      process.exit(1)
    }
  }

  console.log("データベース初期化が完了しました！")
}

// スクリプト実行
main().catch((err) => {
  console.error("初期化中にエラーが発生しました:", err)
  process.exit(1)
})
