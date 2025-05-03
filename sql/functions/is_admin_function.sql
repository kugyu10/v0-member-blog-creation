-- 管理者権限をチェックするRPC関数
CREATE OR REPLACE FUNCTION public.is_admin(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- 重要: 関数を定義したユーザーの権限で実行
AS $$
DECLARE
  is_admin_val BOOLEAN;
BEGIN
  -- user_rolesテーブルから管理者権限を直接取得
  SELECT is_admin INTO is_admin_val
  FROM user_roles
  WHERE user_id = user_id_param;
  
  -- 結果がnullの場合はfalseを返す
  RETURN COALESCE(is_admin_val, false);
END;
$$;

-- 関数へのアクセス権を設定
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO anon;
