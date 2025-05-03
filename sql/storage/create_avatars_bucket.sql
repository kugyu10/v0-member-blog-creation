-- このSQLは管理者が実行する必要があります
-- Supabaseダッシュボードの「SQL Editor」で実行してください

-- avatarsバケットが存在するか確認
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'avatars'
  ) INTO bucket_exists;
  
  IF NOT bucket_exists THEN
    -- バケットが存在しない場合は作成
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true);
    
    -- バケットのRLSポリシーを設定
    -- 認証済みユーザーは自分のファイルをアップロード可能
    INSERT INTO storage.policies (name, bucket_id, operation, definition)
    VALUES 
      ('Avatar Upload Policy', 'avatars', 'INSERT', '(auth.uid() = auth.uid())'),
      ('Avatar Select Policy', 'avatars', 'SELECT', '(true)'),
      ('Avatar Update Policy', 'avatars', 'UPDATE', '(auth.uid() = auth.uid())'),
      ('Avatar Delete Policy', 'avatars', 'DELETE', '(auth.uid() = auth.uid())');
      
    RAISE NOTICE 'Avatars bucket created successfully';
  ELSE
    RAISE NOTICE 'Avatars bucket already exists';
  END IF;
END
$$;
