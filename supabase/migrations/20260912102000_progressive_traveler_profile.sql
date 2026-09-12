-- Progressive Tomorrow Profile: explicit refinement answers only.
-- This migration is intentionally additive and must not be applied until the next controlled migration batch.

create table if not exists public.traveler_profile_refinements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_key text not null,
  stage text not null check (stage in ('style','comfort','rhythm','advanced')),
  choice text not null check (choice in ('left','right','neutral')),
  answered_at timestamptz not null default now(),
  revoked_at timestamptz,
  source text not null default 'travel_match_refinement',
  unique (id, user_id)
);

create unique index if not exists traveler_profile_refinements_active_key
  on public.traveler_profile_refinements (user_id, question_key)
  where revoked_at is null;

alter table public.traveler_profile_refinements enable row level security;

drop policy if exists "Users read own profile refinements" on public.traveler_profile_refinements;
create policy "Users read own profile refinements"
  on public.traveler_profile_refinements for select
  to authenticated
  using (auth.uid() = user_id);

grant select on public.traveler_profile_refinements to authenticated;
grant all on public.traveler_profile_refinements to service_role;

create or replace function public.record_my_profile_refinement(
  p_question_key text,
  p_stage text,
  p_choice text
) returns public.traveler_profile_refinements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.traveler_profile_refinements;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  if p_stage not in ('style','comfort','rhythm','advanced') then raise exception 'invalid stage'; end if;
  if p_choice not in ('left','right','neutral') then raise exception 'invalid choice'; end if;
  if p_question_key is null or length(trim(p_question_key)) < 3 then raise exception 'invalid question key'; end if;

  update public.traveler_profile_refinements
     set revoked_at = now()
   where user_id = v_user_id
     and question_key = p_question_key
     and revoked_at is null;

  insert into public.traveler_profile_refinements (user_id, question_key, stage, choice)
  values (v_user_id, trim(p_question_key), p_stage, p_choice)
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.record_my_profile_refinement(text,text,text) from public;
grant execute on function public.record_my_profile_refinement(text,text,text) to authenticated;
