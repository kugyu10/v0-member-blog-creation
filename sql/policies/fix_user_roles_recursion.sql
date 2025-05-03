-- 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;

-- 新しいRLSポリシーを作成（再帰を防ぐ）
-- 自分自身のロールは閲覧可能（シンプルな条件）
CREATE POLICY "Users can view their own role" 
ON user_roles FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- 管理者フラグを直接チェックする代わりに、固定リストを使用
-- これは一時的な解決策です。本番環境では適切な管理者リストを設定してください
CREATE POLICY "Super admins can view all roles" 
ON user_roles FOR SELECT 
USING (
  -- 特定の管理者ユーザーIDのリスト（実際のIDに置き換えてください）
  auth.uid() IN ('00000000-0000-0000-0000-000000000000')
);
