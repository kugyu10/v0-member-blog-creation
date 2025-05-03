-- 既存のトリガー関数を修正
CREATE OR REPLACE FUNCTION public.handle_new_user_profile() 
RETURNS TRIGGER AS $$
BEGIN
  -- 新規ユーザーに空のプロフィールを作成
  INSERT INTO public.user_profiles (user_id, nickname)
  VALUES (NEW.id, split_part(NEW.email, '@', 1));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_user_plan() 
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- FREEプランのIDを取得
  SELECT id INTO free_plan_id FROM plans WHERE name = 'FREE';
  
  -- 新規ユーザーにFREEプランを割り当てる
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.user_plans (user_id, plan_id)
    VALUES (NEW.id, free_plan_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLSポリシーを修正
-- user_profilesテーブルのRLSポリシー
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "System can insert user profiles" ON user_profiles;

-- 新しいポリシー: 認証されていないユーザーも含めて、すべてのユーザーがプロフィールを挿入可能
CREATE POLICY "Anyone can insert user profiles" 
ON user_profiles FOR INSERT 
WITH CHECK (true);

-- user_plansテーブルのRLSポリシー
DROP POLICY IF EXISTS "Admins can insert user plans" ON user_plans;
DROP POLICY IF EXISTS "System can insert user plans" ON user_plans;

-- 新しいポリシー: 認証されていないユーザーも含めて、すべてのユーザーがプランを挿入可能
CREATE POLICY "Anyone can insert user plans" 
ON user_plans FOR INSERT 
WITH CHECK (true);

-- トリガーを再作成
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_plan ON auth.users;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

CREATE TRIGGER on_auth_user_created_plan
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_plan();

-- 重要: auth.usersテーブルへの挿入を許可するために必要なサービスロール設定を確認
-- これはSQL文ではなく、Supabaseダッシュボードで確認する必要があります
