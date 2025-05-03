-- articlesテーブルのRLSポリシーを修正
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Admins can view all articles" ON articles;
DROP POLICY IF EXISTS "Users can view their own articles" ON articles;
DROP POLICY IF EXISTS "FREE articles are viewable by authenticated users" ON articles;
DROP POLICY IF EXISTS "BASIC articles are viewable by BASIC+ plan users" ON articles;
DROP POLICY IF EXISTS "PRO articles are viewable by PRO+ plan users" ON articles;
DROP POLICY IF EXISTS "VIP articles are viewable by VIP plan users" ON articles;

-- 新しいポリシーを作成（再帰を防ぐ）
-- ユーザーは自分の記事を閲覧可能
CREATE POLICY "Users can view their own articles" 
ON articles FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- FREEレベルの記事は認証済みユーザーなら閲覧可能
CREATE POLICY "FREE articles are viewable by authenticated users" 
ON articles FOR SELECT 
TO authenticated 
USING (access_level = 'FREE');

-- BASICレベルの記事はBASIC以上のプランユーザーが閲覧可能
-- 直接user_plansとplansテーブルを結合して確認
CREATE POLICY "BASIC articles are viewable by BASIC+ plan users" 
ON articles FOR SELECT 
TO authenticated 
USING (
  access_level = 'BASIC' AND
  EXISTS (
    SELECT 1 FROM user_plans up
    JOIN plans p ON up.plan_id = p.id
    WHERE up.user_id = auth.uid() AND p.name IN ('BASIC', 'PRO', 'VIP')
  )
);

-- PROレベルの記事はPRO以上のプランユーザーが閲覧可能
CREATE POLICY "PRO articles are viewable by PRO+ plan users" 
ON articles FOR SELECT 
TO authenticated 
USING (
  access_level = 'PRO' AND
  EXISTS (
    SELECT 1 FROM user_plans up
    JOIN plans p ON up.plan_id = p.id
    WHERE up.user_id = auth.uid() AND p.name IN ('PRO', 'VIP')
  )
);

-- VIPレベルの記事はVIPプランユーザーのみ閲覧可能
CREATE POLICY "VIP articles are viewable by VIP plan users" 
ON articles FOR SELECT 
TO authenticated 
USING (
  access_level = 'VIP' AND
  EXISTS (
    SELECT 1 FROM user_plans up
    JOIN plans p ON up.plan_id = p.id
    WHERE up.user_id = auth.uid() AND p.name = 'VIP'
  )
);

-- 記事作成者または特定の管理者のみが更新・削除可能
CREATE POLICY "Users can update their own articles" 
ON articles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own articles" 
ON articles FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 認証されたユーザーのみが記事を作成可能
CREATE POLICY "Authenticated users can insert articles" 
ON articles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);
