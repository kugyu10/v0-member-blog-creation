-- avatarsバケットを作成するシンプルなスクリプト
-- Supabaseダッシュボードの「SQL Editor」で実行してください

-- バケットが存在するか確認し、存在しない場合は作成
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'avatars'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true);
    
    RAISE NOTICE 'Created avatars bucket';
  ELSE
    -- バケットをパブリックに設定
    UPDATE storage.buckets
    SET public = true
    WHERE name = 'avatars';
    
    RAISE NOTICE 'Updated avatars bucket to public';
  END IF;
END
$$;
