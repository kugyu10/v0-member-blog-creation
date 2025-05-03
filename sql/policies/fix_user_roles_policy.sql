-- 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Admins can view user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;

-- 新しいRLSポリシーを作成
-- 自分自身のロールは閲覧可能
CREATE POLICY "Users can view their own role" 
ON user_roles FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- 管理者は全てのロールを閲覧可能（再帰を避けるため、is_admin関数を使用しない）
CREATE POLICY "Admins can view all roles" 
ON user_roles FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);
