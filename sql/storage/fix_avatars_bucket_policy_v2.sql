-- 新しいSupabaseバージョン用のストレージポリシー設定スクリプト
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

-- 新しいSupabaseバージョンでのRLSポリシー設定
BEGIN;
  -- バケットのRLSを有効化
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

  -- 既存のポリシーを削除（avatarsバケット用）
  DROP POLICY IF EXISTS "Allow public read access for avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to update avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to delete avatars" ON storage.objects;

  -- 新しいポリシーを作成
  -- 公開読み取りアクセス
  CREATE POLICY "Allow public read access for avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

  -- 認証済みユーザーのアップロード許可
  CREATE POLICY "Allow authenticated users to upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

  -- 認証済みユーザーの更新許可
  CREATE POLICY "Allow authenticated users to update avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

  -- 認証済みユーザーの削除許可
  CREATE POLICY "Allow authenticated users to delete avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

  RAISE NOTICE 'Storage policies for avatars bucket updated successfully';
COMMIT;
