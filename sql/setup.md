# データベースセットアップ手順

このドキュメントでは、会員制ブログシステムのデータベースセットアップ手順を説明します。

## 前提条件

- Supabaseプロジェクトが作成済みであること
- Supabaseの管理者権限を持っていること

## セットアップ方法

### 1. 自動セットアップ（推奨）

Node.jsスクリプトを使用して自動的にセットアップを行います。

\`\`\`bash
# 環境変数を設定
export SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# インデックススクリプトを実行
node sql/index.js
\`\`\`

### 2. 手動セットアップ

Supabaseダッシュボードの「SQL Editor」で以下のスクリプトを順番に実行します。

#### テーブル作成

1. `sql/tables/create-user-profiles.sql`
2. `sql/tables/add-user-id-to-articles.sql`
3. `sql/tables/add-article-access-level.sql`

#### 関数作成

1. `sql/functions/is_admin_function.sql`
2. `sql/functions/get_user_plan_function.sql`
3. `sql/functions/get_accessible_articles_function.sql`
4. `sql/functions/create_get_articles_function.sql`

#### ポリシー設定

1. `sql/policies/fix_user_roles_policy.sql`
2. `sql/policies/fix_user_plans_policy.sql`
3. `sql/policies/fix_plans_policy.sql`
4. `sql/policies/fix_articles_rls_policy.sql`
5. `sql/policies/restrict_article_creation.sql`

#### ストレージ設定

1. `sql/storage/create_avatars_bucket_simple.sql`
2. `sql/storage/fix_avatars_bucket_policy_v2.sql`

#### 最終修正

1. `sql/migrations/comprehensive-fix-registration.sql`

## トラブルシューティング

エラーが発生した場合は、以下を確認してください：

1. Supabase URLとサービスロールキーが正しいこと
2. 十分な権限があること
3. スクリプトの実行順序が正しいこと

詳細なエラーログを確認し、必要に応じて個別のスクリプトを実行してください。
