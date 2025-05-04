-- 'OPEN'プランをplansテーブルに追加
INSERT INTO plans (name, description)
VALUES ('OPEN', '一般公開 - ログインなしで閲覧可能') 
ON CONFLICT (name) DO NOTHING;

-- access_levelの制約を更新して'OPEN'を追加
ALTER TABLE articles
DROP CONSTRAINT IF EXISTS articles_access_level_check;

ALTER TABLE articles
ADD CONSTRAINT articles_access_level_check 
CHECK (access_level IN ('OPEN', 'FREE', 'BASIC', 'PRO', 'VIP'));

-- 非ログインユーザー（anonymous）が'OPEN'レベルの記事を閲覧できるようにRLSポリシーを追加
DROP POLICY IF EXISTS "OPEN articles are viewable by everyone" ON articles;

CREATE POLICY "OPEN articles are viewable by everyone" 
ON articles FOR SELECT 
USING (access_level = 'OPEN');

-- RPC関数を更新して'OPEN'レベルの記事も返すように
CREATE OR REPLACE FUNCTION public.get_accessible_articles()
RETURNS SETOF articles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  is_admin_val BOOLEAN;
  user_plan_name TEXT;
BEGIN
  -- 現在のユーザーIDを取得
  current_user_id := auth.uid();
  
  -- 管理者かどうかを確認
  SELECT is_admin INTO is_admin_val
  FROM user_roles
  WHERE user_id = current_user_id;
  
  -- ユーザーのプラン名を取得
  SELECT p.name INTO user_plan_name
  FROM user_plans up
  JOIN plans p ON up.plan_id = p.id
  WHERE up.user_id = current_user_id;
  
  -- 管理者の場合はすべての記事を返す
  IF is_admin_val = true THEN
    RETURN QUERY SELECT * FROM articles ORDER BY created_at DESC;
    RETURN;
  END IF;
  
  -- 認証されていない場合はOPENの記事のみ返す
  IF current_user_id IS NULL THEN
    RETURN QUERY 
    SELECT * FROM articles 
    WHERE access_level = 'OPEN'
    ORDER BY created_at DESC;
    RETURN;
  END IF;
  
  -- 認証済みユーザーの場合は、アクセス可能な記事を返す
  RETURN QUERY 
  SELECT * FROM articles 
  WHERE 
    user_id = current_user_id
    OR access_level = 'OPEN'
    OR access_level = 'FREE'
    OR (access_level = 'BASIC' AND user_plan_name IN ('BASIC', 'PRO', 'VIP'))
    OR (access_level = 'PRO' AND user_plan_name IN ('PRO', 'VIP'))
    OR (access_level = 'VIP' AND user_plan_name = 'VIP')
  ORDER BY created_at DESC;
END;
$$;

-- get_articles_for_user関数も更新
CREATE OR REPLACE FUNCTION public.get_articles_for_user(user_id_param UUID)
RETURNS SETOF articles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin_val BOOLEAN;
  user_plan_name TEXT;
BEGIN
  -- 管理者かどうかを確認
  SELECT is_admin INTO is_admin_val
  FROM user_roles
  WHERE user_id = user_id_param;
  
  -- ユーザーのプラン名を取得
  SELECT p.name INTO user_plan_name
  FROM user_plans up
  JOIN plans p ON up.plan_id = p.id
  WHERE up.user_id = user_id_param;
  
  -- 管理者の場合はすべての記事を返す
  IF is_admin_val = true THEN
    RETURN QUERY SELECT * FROM articles ORDER BY created_at DESC;
    RETURN;
  END IF;
  
  -- user_id_paramがNULLの場合（非ログインユーザー）
  IF user_id_param IS NULL THEN
    RETURN QUERY 
    SELECT * FROM articles 
    WHERE access_level = 'OPEN'
    ORDER BY created_at DESC;
    RETURN;
  END IF;
  
  -- 一般ユーザーの場合は、アクセス可能な記事のみを返す
  RETURN QUERY 
  SELECT * FROM articles 
  WHERE 
    user_id = user_id_param
    OR access_level = 'OPEN'
    OR access_level = 'FREE'
    OR (access_level = 'BASIC' AND user_plan_name IN ('BASIC', 'PRO', 'VIP'))
    OR (access_level = 'PRO' AND user_plan_name IN ('PRO', 'VIP'))
    OR (access_level = 'VIP' AND user_plan_name = 'VIP')
  ORDER BY created_at DESC;
END;
$$;
