# SQL スクリプト

このフォルダには、データベース構造やRLSポリシーを設定するためのSQLスクリプトが含まれています。

## フォルダ構造

- `/tables` - テーブル作成・変更スクリプト
- `/functions` - データベース関数スクリプト
- `/policies` - RLSポリシー設定スクリプト
- `/migrations` - データベースマイグレーションスクリプト
- `/scripts` - Node.jsで実行するスクリプト

## 実行方法

### SQLスクリプト

Supabaseダッシュボードの「SQL Editor」で直接実行できます。

### Node.jsスクリプト

\`\`\`bash
# 環境変数を設定
export SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# スクリプトを実行
node sql/scripts/create-user-roles-table.js
