const { createClient } = require("@supabase/supabase-js")

// Supabaseクライアントの初期化
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function updateArticlesTable() {
  try {
    // user_idカラムを追加
    const { error: alterError } = await supabase.sql`
      ALTER TABLE articles 
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
    `

    if (alterError) {
      console.error("Error adding user_id column:", alterError)
      return false
    }

    // RLSポリシーを更新
    const { error: dropPoliciesError } = await supabase.sql`
      -- 既存のポリシーを削除
      DROP POLICY IF EXISTS "Articles are viewable by everyone" ON articles;
      DROP POLICY IF EXISTS "Anyone can insert articles" ON articles;
      DROP POLICY IF EXISTS "Anyone can update articles" ON articles;
      DROP POLICY IF EXISTS "Anyone can delete articles" ON articles;
    `

    if (dropPoliciesError) {
      console.error("Error dropping existing policies:", dropPoliciesError)
      return false
    }

    // 新しいポリシーを作成
    const { error: createPoliciesError } = await supabase.sql`
      -- すべてのユーザーが記事を閲覧できる
      CREATE POLICY "Articles are viewable by everyone" 
      ON articles FOR SELECT 
      USING (true);
      
      -- 認証されたユーザーのみが記事を作成できる
      CREATE POLICY "Authenticated users can insert articles" 
      ON articles FOR INSERT 
      TO authenticated 
      WITH CHECK (auth.uid() = user_id);
      
      -- 記事作成者のみが更新できる
      CREATE POLICY "Users can update their own articles" 
      ON articles FOR UPDATE 
      TO authenticated 
      USING (auth.uid() = user_id);
      
      -- 記事作成者のみが削除できる
      CREATE POLICY "Users can delete their own articles" 
      ON articles FOR DELETE 
      TO authenticated 
      USING (auth.uid() = user_id);
    `

    if (createPoliciesError) {
      console.error("Error creating new policies:", createPoliciesError)
      return false
    }

    console.log("Articles table updated successfully with user_id and new policies")
    return true
  } catch (err) {
    console.error("Unexpected error:", err)
    return false
  }
}

// テーブル更新の実行
updateArticlesTable().then((success) => {
  if (success) {
    console.log("Database update completed successfully")
  } else {
    console.log("Database update failed")
  }
})
