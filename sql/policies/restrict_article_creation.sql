-- 既存の記事作成ポリシーを削除
DROP POLICY IF EXISTS "Authenticated users can insert articles" ON articles;

-- BASIC以上のプランを持つユーザーのみが記事を作成できるポリシーを追加
CREATE POLICY "BASIC+ users can insert articles" 
ON articles FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM user_plans up
    JOIN plans p ON up.plan_id = p.id
    WHERE up.user_id = auth.uid() AND p.name IN ('BASIC', 'PRO', 'VIP')
  )
);

-- 管理者は常に記事を作成できるポリシーを追加
CREATE POLICY "Admins can insert articles" 
ON articles FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);
