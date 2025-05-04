-- imagesバケットを作成するスクリプト
-- Supabaseダッシュボードの「SQL Editor」で実行してください

-- バケットが存在するか確認し、存在しない場合は作成
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('images', 'images', true);
    
    RAISE NOTICE 'Created images bucket';
  ELSE
    -- バケットをパブリックに設定
    UPDATE storage.buckets
    SET public = true
    WHERE name = 'images';
    
    RAISE NOTICE 'Updated images bucket to public';
  END IF;
END
$$;

-- imagesバケットのRLSポリシー設定
BEGIN;
  -- バケットのRLSを有効化
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

  -- 既存のポリシーを削除（imagesバケット用）
  DROP POLICY IF EXISTS "Allow public read access for images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to update images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to delete images" ON storage.objects;

  -- 新しいポリシーを作成
  -- 公開読み取りアクセス
  CREATE POLICY "Allow public read access for images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

  -- 認証済みユーザーのアップロード許可
  CREATE POLICY "Allow authenticated users to upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

  -- 認証済みユーザーの更新許可
  CREATE POLICY "Allow authenticated users to update images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'images' AND auth.role() = 'authenticated');

  -- 認証済みユーザーの削除許可
  CREATE POLICY "Allow authenticated users to delete images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'images' AND auth.role() = 'authenticated');

  RAISE NOTICE 'Storage policies for images bucket updated successfully';
COMMIT;
