-- トリガー関数を修正（新規ユーザー登録時にプロフィールを自動的に作成）
CREATE OR REPLACE FUNCTION public.handle_new_user_profile() 
RETURNS TRIGGER AS $$
BEGIN
  -- 新規ユーザーに空のプロフィールを作成
  INSERT INTO public.user_profiles (user_id, nickname)
  VALUES (NEW.id, split_part(NEW.email, '@', 1));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガー関数を修正（新規ユーザー登録時にFREEプランを自動的に割り当てる）
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

-- 既存のトリガーをチェックして削除
DO $$
BEGIN
  -- プロフィールトリガーが存在するか確認して削除
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_profile') THEN
    DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
  END IF;
  
  -- プラントリガーが存在するか確認して削除
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_plan') THEN
    DROP TRIGGER IF EXISTS on_auth_user_created_plan ON auth.users;
  END IF;
END
$$;

-- トリガーを作成
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

CREATE TRIGGER on_auth_user_created_plan
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_plan();

-- user_profilesテーブルのRLSポリシーを修正
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "System can insert user profiles" 
ON user_profiles FOR INSERT 
WITH CHECK (true);

-- user_plansテーブルのRLSポリシーを修正
DROP POLICY IF EXISTS "Admins can insert user plans" ON user_plans;
CREATE POLICY "System can insert user plans" 
ON user_plans FOR INSERT 
WITH CHECK (true);

-- 既存のユーザーに対してプロフィールとプランを確認・作成
DO $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- FREEプランのIDを取得
  SELECT id INTO free_plan_id FROM plans WHERE name = 'FREE';
  
  -- プロフィールが設定されていない既存ユーザーに空のプロフィールを作成
  INSERT INTO public.user_profiles (user_id, nickname)
  SELECT au.id, split_part(au.email, '@', 1)
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON au.id = up.user_id
  WHERE up.id IS NULL;
  
  -- プランが設定されていない既存ユーザーにFREEプランを割り当てる
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.user_plans (user_id, plan_id)
    SELECT au.id, free_plan_id
    FROM auth.users au
    LEFT JOIN public.user_plans up ON au.id = up.user_id
    WHERE up.id IS NULL;
  END IF;
END
$$;
