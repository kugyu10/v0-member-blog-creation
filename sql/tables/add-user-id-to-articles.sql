-- articlesテーブルにuser_idカラムが存在するか確認し、存在しない場合は追加
DO $$
BEGIN
  -- user_idカラムが存在するか確認
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'articles' 
    AND column_name = 'user_id'
  ) THEN
    -- user_idカラムを追加
    ALTER TABLE articles 
    ADD COLUMN user_id UUID REFERENCES auth.users(id);
    
    RAISE NOTICE 'user_idカラムを追加しました';
  ELSE
    RAISE NOTICE 'user_idカラムは既に存在しています';
  END IF;
END
$$;

-- 既存のRLSポリシーを確認・更新
DO $$
BEGIN
  -- 記事作成者または管理者のみが更新できるポリシーを確認
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'articles' 
    AND policyname = 'Users can update their own articles or admins can update any'
  ) THEN
    -- ポリシーを作成
    CREATE POLICY "Users can update their own articles or admins can update any" 
    ON articles FOR UPDATE 
    TO authenticated 
    USING (
      auth.uid() = user_id OR
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND is_admin = true
      )
    );
    
    RAISE NOTICE 'ユーザー更新ポリシーを作成しました';
  END IF;
  
  -- 記事作成者または管理者のみが削除できるポリシーを確認
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'articles' 
    AND policyname = 'Users can delete their own articles or admins can delete any'
  ) THEN
    -- ポリシーを作成
    CREATE POLICY "Users can delete their own articles or admins can delete any" 
    ON articles FOR DELETE 
    TO authenticated 
    USING (
      auth.uid() = user_id OR
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND is_admin = true
      )
    );
    
    RAISE NOTICE 'ユーザー削除ポリシーを作成しました';
  END IF;
  
  -- ユーザーは自分の記事を閲覧可能なポリシーを確認
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'articles' 
    AND policyname = 'Users can view their own articles'
  ) THEN
    -- ポリシーを作成
    CREATE POLICY "Users can view their own articles" 
    ON articles FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);
    
    RAISE NOTICE 'ユーザー閲覧ポリシーを作成しました';
  END IF;
END
$$;

-- 既存の記事に現在のユーザーIDを設定（オプション）
-- 注意: これは既存の記事すべてに同じユーザーIDを設定します
-- 実際の環境では、適切なユーザーIDを設定するロジックが必要です
/*
UPDATE articles
SET user_id = '特定のユーザーID'
WHERE user_id IS NULL;
*/
