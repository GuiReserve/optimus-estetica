-- Optimus Estética: contas de studios, administradores e dados de cada studio.
-- Nada é apagado: não existe política de DELETE; o admin apenas bloqueia contas.

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  studio_name text not null check (char_length(studio_name) between 1 and 120),
  owner_name text check (char_length(owner_name) <= 120),
  email text not null unique check (char_length(email) between 3 and 254),
  phone text check (char_length(phone) <= 30),
  plan text not null default 'Mensal' check (char_length(plan) <= 60),
  monthly_fee numeric(10,2) not null default 0 check (monthly_fee >= 0),
  status text not null default 'ativo' check (status in ('ativo', 'bloqueado')),
  paid_until date,
  notes text check (char_length(notes) <= 2000),
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.studio_data (
  account_id uuid primary key references public.accounts(id) on delete restrict,
  data jsonb not null default '{}'::jsonb,
  version integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Histórico de versões dos dados (backup automático de cada salvamento; nunca apagado pelo app).
create table public.studio_data_history (
  id bigint generated always as identity primary key,
  account_id uuid not null references public.accounts(id) on delete restrict,
  data jsonb not null,
  version integer not null,
  saved_at timestamptz not null default now()
);
create index studio_data_history_account_idx on public.studio_data_history (account_id, saved_at desc);

alter table public.admins enable row level security;
alter table public.accounts enable row level security;
alter table public.studio_data enable row level security;
alter table public.studio_data_history enable row level security;

-- ---------- helpers ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.admins where user_id = (select auth.uid())) $$;

create or replace function public.admin_exists()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.admins) $$;

create or replace function public.today_br()
returns date language sql stable set search_path = ''
as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;

create or replace function public.my_active_account_id()
returns uuid language sql stable security definer set search_path = ''
as $$
  select a.id from public.accounts a
  where a.user_id = (select auth.uid())
    and a.status = 'ativo'
    and (a.paid_until is null or a.paid_until >= public.today_br())
$$;

-- Situação da conta do usuário logado (para mostrar bloqueio/vencimento e troca de senha).
create or replace function public.my_account()
returns table (id uuid, studio_name text, status text, paid_until date, must_change_password boolean, active boolean, is_admin boolean)
language sql stable security definer set search_path = ''
as $$
  select a.id, a.studio_name, a.status, a.paid_until, a.must_change_password,
         (a.status = 'ativo' and (a.paid_until is null or a.paid_until >= public.today_br())) as active,
         public.is_admin()
  from public.accounts a where a.user_id = (select auth.uid())
  union all
  select null::uuid, null::text, null::text, null::date, false, false, true
  where public.is_admin() and not exists (select 1 from public.accounts a where a.user_id = (select auth.uid()))
$$;

create or replace function public.password_changed()
returns void language sql security definer set search_path = ''
as $$ update public.accounts set must_change_password = false, updated_at = now() where user_id = (select auth.uid()) $$;

-- Salva os dados do studio com controle de versão (evita sobrescrever alterações de outro aparelho)
-- e guarda a versão anterior no histórico.
create or replace function public.save_studio_data(p_data jsonb, p_version integer)
returns integer language plpgsql security definer set search_path = ''
as $$
declare
  acc uuid := public.my_active_account_id();
  cur integer;
  old jsonb;
begin
  if acc is null then raise exception 'conta_inativa' using errcode = '42501'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then raise exception 'dados_invalidos'; end if;
  if octet_length(p_data::text) > 5000000 then raise exception 'dados_grandes_demais'; end if;
  select version, data into cur, old from public.studio_data where account_id = acc for update;
  if not found then
    insert into public.studio_data (account_id, data, version) values (acc, p_data, 1);
    return 1;
  end if;
  if cur <> p_version then raise exception 'conflito_versao' using errcode = '40001'; end if;
  if old <> '{}'::jsonb then
    insert into public.studio_data_history (account_id, data, version) values (acc, old, cur);
  end if;
  update public.studio_data set data = p_data, version = cur + 1, updated_at = now() where account_id = acc;
  return cur + 1;
end $$;

-- ---------- políticas ----------
create policy "admins: ver a si mesmo" on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

create policy "accounts: admin ou dono veem" on public.accounts for select to authenticated
  using ((select public.is_admin()) or user_id = (select auth.uid()));
create policy "accounts: admin cria" on public.accounts for insert to authenticated
  with check ((select public.is_admin()));
create policy "accounts: admin edita" on public.accounts for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "studio_data: dono ativo lê" on public.studio_data for select to authenticated
  using (account_id = (select public.my_active_account_id()));

create policy "historico: dono ativo lê" on public.studio_data_history for select to authenticated
  using (account_id = (select public.my_active_account_id()));

-- ---------- permissões das funções ----------
revoke execute on function public.is_admin(), public.admin_exists(), public.today_br(), public.my_active_account_id(),
  public.my_account(), public.password_changed(), public.save_studio_data(jsonb, integer) from public, anon;
grant execute on function public.is_admin(), public.today_br(), public.my_active_account_id(),
  public.my_account(), public.password_changed(), public.save_studio_data(jsonb, integer) to authenticated;
grant execute on function public.admin_exists() to anon, authenticated;

revoke all on public.admins, public.accounts, public.studio_data, public.studio_data_history from anon;
