const { createClient } = require("@supabase/supabase-js")

// Supabaseクライアントの初期化
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function createPlansTable() {
  try {
    // plansテーブルの作成
    const { error: createPlansTableError } = await supabase.sql`
      CREATE TABLE IF NOT EXISTS plans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- プランのデータを挿入
      INSERT INTO plans (name, description) VALUES
        ('FREE', '無料プラン - 基本機能のみ利用可能') ON CONFLICT (name) DO NOTHING;
      INSERT INTO plans (name, description) VALUES
        ('BASIC', 'ベーシックプラン - 追加機能が利用可能') ON CONFLICT (name) DO NOTHING;
      INSERT INTO plans (name, description) VALUES
        ('PRO', 'プロフェッショナルプラン - すべての機能が利用可能') ON CONFLICT (name) DO NOTHING;
      INSERT INTO plans (name, description) VALUES
        ('VIP', 'VIPプラン - 優先サポート付き') ON CONFLICT (name) DO NOTHING;
    `

    if (createPlansTableError) {
      console.error("Error creating plans table:", createPlansTableError)
      return false
    }

    // プランテーブルのRLSを設定
    const { error: plansRLSError } = await supabase.sql`
      -- RLSを有効化
      ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

      -- 全てのユーザーが閲覧可能
      CREATE POLICY "Plans are viewable by everyone" 
      ON plans FOR SELECT 
      USING (true);
    `

    if (plansRLSError) {
      console.error("Error setting up plans RLS:", plansRLSError)
      return false
    }

    // user_plansテーブルの作成
    const { error: createUserPlansTableError } = await supabase.sql`
      CREATE TABLE IF NOT EXISTS user_plans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
        start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        end_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `

    if (createUserPlansTableError) {
      console.error("Error creating user_plans table:", createUserPlansTableError)
      return false
    }

    // user_plansテーブルのRLSを設定
    const { error: userPlansRLSError } = await supabase.sql`
      -- RLSを有効化
      ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

      -- 自分自身のプラン情報は閲覧可能
      CREATE POLICY "Users can view their own plan" 
      ON user_plans FOR SELECT 
      TO authenticated 
      USING (user_id = auth.uid());

      -- 管理者はすべてのプラン情報を閲覧可能
      CREATE POLICY "Admins can view all plans" 
      ON user_plans FOR SELECT 
      TO authenticated 
      USING (
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() AND is_admin = true
        )
      );

      -- 管理者のみが更新可能
      CREATE POLICY "Admins can update user plans" 
      ON user_plans FOR UPDATE 
      TO authenticated 
      USING (
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() AND is_admin = true
        )
      );

      -- 管理者のみが挿入可能
      CREATE POLICY "Admins can insert user plans" 
      ON user_plans FOR INSERT 
      TO authenticated 
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() AND is_admin = true
        )
      );

      -- 管理者のみが削除可能
      CREATE POLICY "Admins can delete user plans" 
      ON user_plans FOR DELETE 
      TO authenticated 
      USING (
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() AND is_admin = true
        )
      );
    `

    if (userPlansRLSError) {
      console.error("Error setting up user_plans RLS:", userPlansRLSError)
      return false
    }

    // トリガー関数を作成（新規ユーザー登録時にFREEプランを自動的に割り当てる）
    const { error: createTriggerError } = await supabase.sql`
      -- トリガー関数を作成
      CREATE OR REPLACE FUNCTION public.handle_new_user() 
      RETURNS TRIGGER AS $$
      DECLARE
        free_plan_id UUID;
      BEGIN
        -- FREEプランのIDを取得
        SELECT id INTO free_plan_id FROM plans WHERE name = 'FREE';
        
        -- 新規ユーザーにFREEプランを割り当てる
        INSERT INTO public.user_plans (user_id, plan_id)
        VALUES (NEW.id, free_plan_id);
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    if (createTriggerError) {
      console.error("Error creating trigger function:", createTriggerError)
      return false
    }

    // 既存のトリガーをチェックして削除
    const { error: checkTriggerError } = await supabase.sql`
      DO $$
      BEGIN
        -- トリガーが存在するか確認して削除
        IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
          DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        END IF;
      END
      $$;
    `

    if (checkTriggerError) {
      console.error("Error checking existing trigger:", checkTriggerError)
      return false
    }

    // トリガーを作成
    const { error: createTriggerOnUsersError } = await supabase.sql`
      -- auth.usersテーブルにトリガーを設定
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `

    if (createTriggerOnUsersError) {
      console.error("Error creating trigger on users:", createTriggerOnUsersError)
      return false
    }

    // 既存のユーザーに対してFREEプランを割り当てる
    const { error: assignFreePlanError } = await supabase.sql`
      -- FREEプランのIDを取得
      DO $$
      DECLARE
        free_plan_id UUID;
      BEGIN
        -- FREEプランのIDを取得
        SELECT id INTO free_plan_id FROM plans WHERE name = 'FREE';
        
        -- プランが設定されていない既存ユーザーにFREEプランを割り当てる
        INSERT INTO public.user_plans (user_id, plan_id)
        SELECT au.id, free_plan_id
        FROM auth.users au
        LEFT JOIN public.user_plans up ON au.id = up.user_id
        WHERE up.id IS NULL;
      END
      $$;
    `

    if (assignFreePlanError) {
      console.error("Error assigning FREE plan to existing users:", assignFreePlanError)
      return false
    }

    console.log("Plans and user_plans tables created successfully")
    return true
  } catch (err) {
    console.error("Unexpected error:", err)
    return false
  }
}

// テーブル作成の実行
createPlansTable().then((success) => {
  if (success) {
    console.log("Plans setup completed successfully")
  } else {
    console.log("Plans setup failed")
  }
})
