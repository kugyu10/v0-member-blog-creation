-- まず、既存のトリガーを完全に削除
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_plan ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- トリガー関数も削除して再作成
DROP FUNCTION IF EXISTS public.handle_new_user_profile();
DROP FUNCTION IF EXISTS public.handle_new_user_plan();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 単一の統合されたトリガー関数を作成（エラーハンドリング強化）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- エラーハンドリングを強化
  BEGIN
    -- FREEプランのIDを取得
    SELECT id INTO free_plan_id FROM plans WHERE name = 'FREE';
    
    -- プロフィールを作成
    INSERT INTO public.user_profiles (user_id, nickname)
    VALUES (NEW.id, split_part(NEW.email, '@', 1));
    
    -- プランを割り当て
    IF free_plan_id IS NOT NULL THEN
      INSERT INTO public.user_plans (user_id, plan_id)
      VALUES (NEW.id, free_plan_id);
    END IF;
    
    EXCEPTION WHEN OTHERS THEN
      -- エラーをログに記録するが、トリガー自体は失敗させない
      RAISE NOTICE 'Error in handle_new_user trigger: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 新しい単一のトリガーを作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- すべてのテーブルのRLSポリシーを見直し

-- user_profilesテーブルのRLSポリシー
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "System can insert user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Anyone can insert user profiles" ON user_profiles;

-- 新しいポリシー
CREATE POLICY "Profiles are viewable by everyone" 
ON user_profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON user_profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert user profiles" 
ON user_profiles FOR INSERT 
WITH CHECK (true);

-- user_plansテーブルのRLSポリシー
ALTER TABLE user_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own plan" ON user_plans;
DROP POLICY IF EXISTS "Admins can view all plans" ON user_plans;
DROP POLICY IF EXISTS "Admins can update user plans" ON user_plans;
DROP POLICY IF EXISTS "Admins can insert user plans" ON user_plans;
DROP POLICY IF EXISTS "Admins can delete user plans" ON user_plans;
DROP POLICY IF EXISTS "System can insert user plans" ON user_plans;
DROP POLICY IF EXISTS "Anyone can insert user plans" ON user_plans;

-- 新しいポリシー
CREATE POLICY "Users can view their own plan" 
ON user_plans FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all plans" 
ON user_plans FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admins can update user plans" 
ON user_plans FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Anyone can insert user plans" 
ON user_plans FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can delete user plans" 
ON user_plans FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

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
