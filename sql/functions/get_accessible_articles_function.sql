-- アクセス可能な記事を取得するRPC関数
CREATE OR REPLACE FUNCTION public.get_accessible_articles()
RETURNS SETOF articles
LANGUAGE plpgsql
SECURITY DEFINER -- 重要: 関数を定義したユーザーの権限で実行
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
  
  -- 認証されていない場合は空の結果を返す
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- ユーザー自身の記事を返す
  RETURN QUERY 
  SELECT * FROM articles 
  WHERE 
    user_id = current_user_id
    OR access_level = 'FREE'
    OR (access_level = 'BASIC' AND user_plan_name IN ('BASIC', 'PRO', 'VIP'))
    OR (access_level = 'PRO' AND user_plan_name IN ('PRO', 'VIP'))
    OR (access_level = 'VIP' AND user_plan_name = 'VIP')
  ORDER BY created_at DESC;
END;
$$;

-- 関数へのアクセス権を設定
GRANT EXECUTE ON FUNCTION public.get_accessible_articles TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_accessible_articles TO anon;
