const { createClient } = require("@supabase/supabase-js")

// Supabaseクライアントの初期化
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function addArticleAccessLevel() {
  try {
    // access_levelカラムを追加
    const { error: alterError } = await supabase.sql`
      ALTER TABLE articles 
      ADD COLUMN IF NOT EXISTS access_level TEXT NOT NULL DEFAULT 'FREE';
    `

    if (alterError) {
      console.error("Error adding access_level column:", alterError)
      return false
    }

    // access_levelにチェック制約を追加
    const { error: constraintError } = await supabase.sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'articles_access_level_check'
        ) THEN
          ALTER TABLE articles 
          ADD CONSTRAINT articles_access_level_check 
          CHECK (access_level IN ('FREE', 'BASIC', 'PRO', 'VIP'));
        END IF;
      END
      $$;
    `

    if (constraintError) {
      console.error("Error adding constraint:", constraintError)
      return false
    }

    // RLSポリシーを更新
    const { error: dropPoliciesError } = await supabase.sql`
      -- 既存のポリシーを削除
      DROP POLICY IF EXISTS "Articles are viewable by everyone" ON articles;
      DROP POLICY IF EXISTS "Authenticated users can insert articles" ON articles;
      DROP POLICY IF EXISTS "Users can update their own articles" ON articles;
      DROP POLICY IF EXISTS "Users can delete their own articles" ON articles;
    `

    if (dropPoliciesError) {
      console.error("Error dropping existing policies:", dropPoliciesError)
      return false
    }

    // 新しいポリシーを作成
    const { error: createPoliciesError } = await supabase.sql`
      -- 管理者は全ての記事を閲覧可能
      CREATE POLICY "Admins can view all articles" 
      ON articles FOR SELECT 
      TO authenticated 
      USING (
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() AND is_admin = true
        )
      );
      
      -- ユーザーは自分の記事を閲覧可能
      CREATE POLICY "Users can view their own articles" 
      ON articles FOR SELECT 
      TO authenticated 
      USING (auth.uid() = user_id);
      
      -- FREEレベルの記事は認証済みユーザーなら閲覧可能
      CREATE POLICY "FREE articles are viewable by authenticated users" 
      ON articles FOR SELECT 
      TO authenticated 
      USING (access_level = 'FREE');
      
      -- BASICレベルの記事はBASIC以上のプランユーザーが閲覧可能
      CREATE POLICY "BASIC articles are viewable by BASIC+ plan users" 
      ON articles FOR SELECT 
      TO authenticated 
      USING (
        access_level = 'BASIC' AND
        EXISTS (
          SELECT 1 FROM user_plans up
          JOIN plans p ON up.plan_id = p.id
          WHERE up.user_id = auth.uid() AND p.name IN ('BASIC', 'PRO', 'VIP')
        )
      );
      
      -- PROレベルの記事はPRO以上のプランユーザーが閲覧可能
      CREATE POLICY "PRO articles are viewable by PRO+ plan users" 
      ON articles FOR SELECT 
      TO authenticated 
      USING (
        access_level = 'PRO' AND
        EXISTS (
          SELECT 1 FROM user_plans up
          JOIN plans p ON up.plan_id = p.id
          WHERE up.user_id = auth.uid() AND p.name IN ('PRO', 'VIP')
        )
      );
      
      -- VIPレベルの記事はVIPプランユーザーのみ閲覧可能
      CREATE POLICY "VIP articles are viewable by VIP plan users" 
      ON articles FOR SELECT 
      TO authenticated 
      USING (
        access_level = 'VIP' AND
        EXISTS (
          SELECT 1 FROM user_plans up
          JOIN plans p ON up.plan_id = p.id
          WHERE up.user_id = auth.uid() AND p.name = 'VIP'
        )
      );
      
      -- 認証されたユーザーのみが記事を作成できる
      CREATE POLICY "Authenticated users can insert articles" 
      ON articles FOR INSERT 
      TO authenticated 
      WITH CHECK (auth.uid() = user_id);
      
      -- 記事作成者または管理者のみが更新できる
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
      
      -- 記事作成者または管理者のみが削除できる
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
    `

    if (createPoliciesError) {
      console.error("Error creating new policies:", createPoliciesError)
      return false
    }

    console.log("Articles table updated successfully with access_level and new policies")
    return true
  } catch (err) {
    console.error("Unexpected error:", err)
    return false
  }
}

// テーブル更新の実行
addArticleAccessLevel().then((success) => {
  if (success) {
    console.log("Database update completed successfully")
  } else {
    console.log("Database update failed")
  }
})
