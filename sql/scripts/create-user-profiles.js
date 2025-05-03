const { createClient } = require("@supabase/supabase-js")

// Supabaseクライアントの初期化
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function setupUserProfiles() {
  try {
    // user_profilesテーブルの作成
    const { error: createTableError } = await supabase.sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        nickname TEXT,
        bio TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `

    if (createTableError) {
      console.error("Error creating user_profiles table:", createTableError)
      return false
    }

    // RLSポリシーを設定
    const { error: enableRLSError } = await supabase.sql`
      -- RLSを有効化
      ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    `

    if (enableRLSError) {
      console.error("Error enabling RLS:", enableRLSError)
      return false
    }

    // ポリシーの作成
    const { error: createPoliciesError } = await supabase.sql`
      -- 全てのユーザーがプロフィールを閲覧可能
      CREATE POLICY "Profiles are viewable by everyone" 
      ON user_profiles FOR SELECT 
      USING (true);
      
      -- 自分自身のプロフィールのみ更新可能
      CREATE POLICY "Users can update their own profile" 
      ON user_profiles FOR UPDATE 
      TO authenticated 
      USING (auth.uid() = user_id);
      
      -- 自分自身のプロフィールのみ挿入可能
      CREATE POLICY "Users can insert their own profile" 
      ON user_profiles FOR INSERT 
      TO authenticated 
      WITH CHECK (auth.uid() = user_id);
    `

    if (createPoliciesError) {
      console.error("Error creating policies:", createPoliciesError)
      return false
    }

    // トリガー関数を作成（新規ユーザー登録時に空のプロフィールを自動的に作成）
    const { error: createTriggerError } = await supabase.sql`
      -- トリガー関数を作成
      CREATE OR REPLACE FUNCTION public.handle_new_user_profile() 
      RETURNS TRIGGER AS $$
      BEGIN
        -- 新規ユーザーに空のプロフィールを作成
        INSERT INTO public.user_profiles (user_id, nickname)
        VALUES (NEW.id, split_part(NEW.email, '@', 1));
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    if (createTriggerError) {
      console.error("Error creating profile trigger function:", createTriggerError)
      return false
    }

    // 既存のトリガーをチェックして削除
    const { error: checkTriggerError } = await supabase.sql`
      DO $$
      BEGIN
        -- トリガーが存在するか確認して削除
        IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_profile') THEN
          DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
        END IF;
      END
      $$;
    `

    if (checkTriggerError) {
      console.error("Error checking existing profile trigger:", checkTriggerError)
      return false
    }

    // トリガーを作成
    const { error: createTriggerOnUsersError } = await supabase.sql`
      -- auth.usersテーブルにトリガーを設定
      CREATE TRIGGER on_auth_user_created_profile
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
    `

    if (createTriggerOnUsersError) {
      console.error("Error creating profile trigger on users:", createTriggerOnUsersError)
      return false
    }

    // 既存のユーザーに対して空のプロフィールを作成
    const { error: createProfilesError } = await supabase.sql`
      -- プロフィールが設定されていない既存ユーザーに空のプロフィールを作成
      INSERT INTO public.user_profiles (user_id, nickname)
      SELECT au.id, split_part(au.email, '@', 1)
      FROM auth.users au
      LEFT JOIN public.user_profiles up ON au.id = up.user_id
      WHERE up.id IS NULL;
    `

    if (createProfilesError) {
      console.error("Error creating profiles for existing users:", createProfilesError)
      return false
    }

    // Storageバケットの作成
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError)
      return false
    }

    // avatarsバケットが存在するかチェック
    const avatarsBucketExists = buckets.some((bucket) => bucket.name === "avatars")

    if (!avatarsBucketExists) {
      // avatarsバケットを作成
      const { error: createBucketError } = await supabase.storage.createBucket("avatars", {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      })

      if (createBucketError) {
        console.error("Error creating avatars bucket:", createBucketError)
        return false
      }

      console.log("Created avatars bucket with 10MB file size limit")
    } else {
      // 既存のバケットを更新
      const { error: updateBucketError } = await supabase.storage.updateBucket("avatars", {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      })

      if (updateBucketError) {
        console.error("Error updating avatars bucket:", updateBucketError)
        return false
      }

      console.log("Updated avatars bucket with 10MB file size limit")
    }

    console.log("User profiles setup completed successfully")
    return true
  } catch (err) {
    console.error("Unexpected error:", err)
    return false
  }
}

// セットアップの実行
setupUserProfiles().then((success) => {
  if (success) {
    console.log("User profiles setup completed successfully")
  } else {
    console.log("User profiles setup failed")
  }
})
