-- avatarsバケットのRLSポリシーを修正するスクリプト
-- Supabaseダッシュボードの「SQL Editor」で実行してください

-- 既存のポリシーを削除
DO $$
BEGIN
  -- 既存のポリシーを削除
  DELETE FROM storage.policies 
  WHERE bucket_id = 'avatars';
  
  -- 新しいポリシーを作成
  -- すべてのユーザーが閲覧可能
  INSERT INTO storage.policies (name, bucket_id, operation, definition)
  VALUES ('Avatar Select Policy', 'avatars', 'SELECT', 'true');
  
  -- 認証済みユーザーはアップロード可能
  INSERT INTO storage.policies (name, bucket_id, operation, definition)
  VALUES ('Avatar Insert Policy', 'avatars', 'INSERT', 'auth.role() = ''authenticated''');
  
  -- 認証済みユーザーは自分のファイルを更新可能
  INSERT INTO storage.policies (name, bucket_id, operation, definition)
  VALUES ('Avatar Update Policy', 'avatars', 'UPDATE', 'auth.role() = ''authenticated''');
  
  -- 認証済みユーザーは自分のファイルを削除可能
  INSERT INTO storage.policies (name, bucket_id, operation, definition)
  VALUES ('Avatar Delete Policy', 'avatars', 'DELETE', 'auth.role() = ''authenticated''');
  
  -- バケットをパブリックに設定
  UPDATE storage.buckets
  SET public = true
  WHERE name = 'avatars';
  
  RAISE NOTICE 'Avatars bucket policies updated successfully';
END
$$;
