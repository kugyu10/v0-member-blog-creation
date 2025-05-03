-- ユーザープランを取得するRPC関数
CREATE OR REPLACE FUNCTION public.get_user_plan(user_id_param UUID)
RETURNS TABLE (
  plan_id UUID,
  plan_name TEXT,
  plan_description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER -- 重要: 関数を定義したユーザーの権限で実行
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS plan_id,
    p.name AS plan_name,
    p.description AS plan_description
  FROM 
    user_plans up
  JOIN 
    plans p ON up.plan_id = p.id
  WHERE 
    up.user_id = user_id_param;
END;
$$;

-- 関数へのアクセス権を設定
GRANT EXECUTE ON FUNCTION public.get_user_plan TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_plan TO anon;
