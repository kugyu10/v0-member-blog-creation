-- 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Users can view their own plan" ON user_plans;
DROP POLICY IF EXISTS "Admins can view all plans" ON user_plans;

-- 新しいRLSポリシーを作成
-- 自分自身のプランは閲覧可能
CREATE POLICY "Users can view their own plan" 
ON user_plans FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- 管理者は全てのプランを閲覧可能（再帰を避けるため、直接user_rolesテーブルを参照）
CREATE POLICY "Admins can view all plans" 
ON user_plans FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);
