-- user_profilesテーブルの作成
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLSを有効化
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 全てのユーザーがプロフィールを閲覧可能
CREATE POLICY "Profiles are viewable by everyone" 
ON user_profiles FOR SELECT 
USING (true);

-- 自分自身のプロフィールのみ更新可能
CREATE POLICY "Users can update their own profile" 
ON user_profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- 自分自身のプロフィールのみ挿入可能
CREATE POLICY "Users can insert their own profile" 
ON user_profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- トリガー関数を作成（新規ユーザー登録時に空のプロフィールを自動的に作成）
CREATE OR REPLACE FUNCTION public.handle_new_user_profile() 
RETURNS TRIGGER AS $$
BEGIN
  -- 新規ユーザーに空のプロフィールを作成
  INSERT INTO public.user_profiles (user_id, nickname)
  VALUES (NEW.id, split_part(NEW.email, '@', 1));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 既存のトリガーをチェックして削除
DO $$
BEGIN
  -- トリガーが存在するか確認して削除
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_profile') THEN
    DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
  END IF;
END
$$;

-- トリガーを作成
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- プロフィールが設定されていない既存ユーザーに空のプロフィールを作成
INSERT INTO public.user_profiles (user_id, nickname)
SELECT au.id, split_part(au.email, '@', 1)
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
WHERE up.id IS NULL;
