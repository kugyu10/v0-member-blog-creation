const { createClient } = require("@supabase/supabase-js")

// Supabaseクライアントの初期化
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function createUserRolesTable() {
  try {
    // user_rolesテーブルの作成
    const { error: createTableError } = await supabase.sql`
      CREATE TABLE IF NOT EXISTS user_roles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `

    if (createTableError) {
      console.error("Error creating user_roles table:", createTableError)
      return false
    }

    // RLSポリシーを設定
    const { error: enableRLSError } = await supabase.sql`
      -- RLSを有効化
      ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
    `

    if (enableRLSError) {
      console.error("Error enabling RLS:", enableRLSError)
      return false
    }

    // ポリシーの作成
    const { error: createPoliciesError } = await supabase.sql`
      -- 管理者のみが閲覧可能
      CREATE POLICY "Admins can view user roles" 
      ON user_roles FOR SELECT 
      TO authenticated 
      USING (
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() AND is_admin = true
        )
      );
      
      -- 管理者のみが更新可能
      CREATE POLICY "Admins can update user roles" 
      ON user_roles FOR UPDATE 
      TO authenticated 
      USING (
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() AND is_admin = true
        )
      );
      
      -- 管理者のみが挿入可能
      CREATE POLICY "Admins can insert user roles" 
      ON user_roles FOR INSERT 
      TO authenticated 
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() AND is_admin = true
        )
      );
      
      -- 自分自身のロールは閲覧可能
      CREATE POLICY "Users can view their own role" 
      ON user_roles FOR SELECT 
      TO authenticated 
      USING (user_id = auth.uid());
    `

    if (createPoliciesError) {
      console.error("Error creating policies:", createPoliciesError)
      return false
    }

    // 最初の管理者ユーザーを設定（必要に応じて）
    // 注意: 実際の環境では、最初の管理者ユーザーのメールアドレスを適切に設定してください
    const adminEmail = "admin@example.com" // 最初の管理者ユーザーのメールアドレス

    // 指定したメールアドレスのユーザーを検索
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      console.error("Error fetching users:", userError)
      return false
    }

    const adminUser = userData.users.find((user) => user.email === adminEmail)

    if (adminUser) {
      // 管理者権限を付与
      const { error: insertError } = await supabase.from("user_roles").upsert({
        user_id: adminUser.id,
        is_admin: true,
      })

      if (insertError) {
        console.error("Error setting admin user:", insertError)
        return false
      }

      console.log(`Admin role assigned to ${adminEmail}`)
    } else {
      console.log(`User with email ${adminEmail} not found. Please set an admin user manually.`)
    }

    console.log("User roles table created successfully")
    return true
  } catch (err) {
    console.error("Unexpected error:", err)
    return false
  }
}

// テーブル作成の実行
createUserRolesTable().then((success) => {
  if (success) {
    console.log("User roles table setup completed successfully")
  } else {
    console.log("User roles table setup failed")
  }
})
