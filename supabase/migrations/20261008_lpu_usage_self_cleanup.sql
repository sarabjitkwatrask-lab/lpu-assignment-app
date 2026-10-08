-- Optional: lets a signed-in user delete THEIR OWN usage records older than 24 hours
-- (used by "Delete my saved assignments" on the Account page).
-- Records from the last 24 hours stay, because they back the daily fair-use limits,
-- so this cannot be used to reset the limits. Run once in the Supabase SQL editor.

create policy "lpu users clear old usage"
  on public.lpu_usage for delete to authenticated
  using ((select auth.uid()) = user_id and created_at < now() - interval '24 hours');
