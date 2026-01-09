-- Function to atomically increment aura points
create or replace function increment_aura(
  p_group_id uuid, -- Changed from float8 to uuid
  p_user_id uuid,
  p_amount int
)
returns void
language plpgsql
security definer
as $$
begin
  update members
  set aura_points = aura_points + p_amount
  where group_id = p_group_id
  and user_id = p_user_id;
end;
$$;
