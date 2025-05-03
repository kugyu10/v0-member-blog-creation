-- plansテーブルのRLSポリシーを修正
-- 全てのユーザーがプランを閲覧可能にする
DROP POLICY IF EXISTS "Plans are viewable by everyone" ON plans;

CREATE POLICY "Plans are viewable by everyone" 
ON plans FOR SELECT 
USING (true);
