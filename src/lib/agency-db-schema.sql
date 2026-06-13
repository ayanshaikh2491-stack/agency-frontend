-- ============================================================
-- Agency Platform — Complete Supabase / PostgreSQL Schema
-- ============================================================

-- 0. Extensions
-- ============================================================
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. Tables
-- ============================================================

-- 1.1 profiles (extends auth.users)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  role        text not null default 'client' check (role in ('admin', 'owner', 'client')),
  created_at  timestamptz not null default now()
);

-- 1.2 agencies
create table public.agencies (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  owner_id           uuid not null references public.profiles(id) on delete cascade,
  created_at         timestamptz not null default now(),
  stripe_customer_id text,
  subscription_status text not null default 'inactive' check (subscription_status in ('active', 'inactive', 'past_due', 'canceled')),
  settings           jsonb not null default '{}'::jsonb
);

-- 1.3 clients
create table public.clients (
  id         uuid primary key default gen_random_uuid(),
  agency_id  uuid not null references public.agencies(id) on delete cascade,
  name       text not null,
  email      text,
  phone      text,
  company    text,
  website    text,
  industry   text,
  status     text not null default 'active' check (status in ('active', 'inactive', 'lead', 'churned')),
  notes      text,
  created_at timestamptz not null default now()
);

-- 1.4 client_briefs
create table public.client_briefs (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients(id) on delete cascade,
  content        jsonb not null default '{}'::jsonb,
  goals          text,
  budget         text,
  target_audience text,
  created_by     uuid not null references public.profiles(id),
  created_at     timestamptz not null default now()
);

-- 1.5 workflows
create table public.workflows (
  id         uuid primary key default gen_random_uuid(),
  agency_id  uuid not null references public.agencies(id) on delete cascade,
  name       text not null,
  description text,
  phases     jsonb not null default '[]'::jsonb,
  config     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 1.6 workflow_runs
create table public.workflow_runs (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients(id) on delete cascade,
  workflow_id      uuid not null references public.workflows(id) on delete cascade,
  status           text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  started_by       uuid references public.profiles(id),
  started_at       timestamptz not null default now(),
  completed_at     timestamptz,
  results          jsonb default null,
  tokens_used      bigint default 0
);

-- 1.7 agent_outputs
create table public.agent_outputs (
  id               uuid primary key default gen_random_uuid(),
  workflow_run_id  uuid not null references public.workflow_runs(id) on delete cascade,
  agent_name       text not null,
  output_type      text not null,
  content          text not null default '',
  status           text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  quality_score    numeric(3,2) check (quality_score >= 0 and quality_score <= 1),
  created_at       timestamptz not null default now()
);

-- 1.8 conversations (CEO Agent chat)
create table public.conversations (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  messages   jsonb not null default '[]'::jsonb,
  agent_name text not null default 'ceo-agent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.9 reports
create table public.reports (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients(id) on delete cascade,
  workflow_run_id  uuid references public.workflow_runs(id) on delete set null,
  type             text not null check (type in ('weekly', 'monthly', 'campaign', 'custom')),
  content          jsonb not null default '{}'::jsonb,
  generated_at     timestamptz not null default now(),
  sent_to_client   boolean not null default false
);

-- ============================================================
-- 2. Indexes
-- ============================================================

create index idx_profiles_role on public.profiles(role);
create index idx_agencies_owner on public.agencies(owner_id);
create index idx_clients_agency on public.clients(agency_id);
create index idx_clients_status on public.clients(status);
create index idx_client_briefs_client on public.client_briefs(client_id);
create index idx_workflows_agency on public.workflows(agency_id);
create index idx_workflow_runs_client on public.workflow_runs(client_id);
create index idx_workflow_runs_workflow on public.workflow_runs(workflow_id);
create index idx_workflow_runs_status on public.workflow_runs(status);
create index idx_agent_outputs_run on public.agent_outputs(workflow_run_id);
create index idx_conversations_client on public.conversations(client_id);
create index idx_conversations_user on public.conversations(user_id);
create index idx_reports_client on public.reports(client_id);

-- ============================================================
-- 3. Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.agencies enable row level security;
alter table public.clients enable row level security;
alter table public.client_briefs enable row level security;
alter table public.workflows enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.agent_outputs enable row level security;
alter table public.conversations enable row level security;
alter table public.reports enable row level security;

-- Helper: get the agency_id for the current user
create or replace function public.current_user_agency_id()
returns uuid
language sql
stable
as $$
  select p.agency_id
  from public.agency_members p
  where p.profile_id = auth.uid()
  limit 1;
$$;

-- 3.1 profiles: users can read their own profile; admins read all
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'owner')
  ));

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3.2 agencies: owner / admin access only
create policy "Agency owner full access"
  on public.agencies for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Admin read access to agencies"
  on public.agencies for select
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

-- 3.3 clients: agency-scoped access
create policy "Users can view clients in their agency"
  on public.clients for select
  using (
    exists (
      select 1 from public.agencies
      where agencies.id = clients.agency_id
      and (agencies.owner_id = auth.uid())
    )
    or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can insert clients in their agency"
  on public.clients for insert
  with check (
    exists (
      select 1 from public.agencies
      where agencies.id = clients.agency_id
      and agencies.owner_id = auth.uid()
    )
  );

create policy "Users can update clients in their agency"
  on public.clients for update
  using (
    exists (
      select 1 from public.agencies
      where agencies.id = clients.agency_id
      and agencies.owner_id = auth.uid()
    )
  );

create policy "Users can delete clients in their agency"
  on public.clients for delete
  using (
    exists (
      select 1 from public.agencies
      where agencies.id = clients.agency_id
      and agencies.owner_id = auth.uid()
    )
  );

-- 3.4 client_briefs: scoped to client's agency
create policy "Briefs accessible via client agency"
  on public.client_briefs for select
  using (
    exists (
      select 1 from public.clients
      join public.agencies on agencies.id = clients.agency_id
      where clients.id = client_briefs.client_id
      and (agencies.owner_id = auth.uid())
    )
    or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Briefs insertable by agency members"
  on public.client_briefs for insert
  with check (
    exists (
      select 1 from public.clients
      join public.agencies on agencies.id = clients.agency_id
      where clients.id = client_briefs.client_id
      and agencies.owner_id = auth.uid()
    )
  );

-- 3.5 workflows: agency-scoped
create policy "Workflows readable by agency members"
  on public.workflows for select
  using (
    exists (
      select 1 from public.agencies
      where agencies.id = workflows.agency_id
      and (agencies.owner_id = auth.uid())
    )
    or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Workflows manageable by agency owner"
  on public.workflows for insert
  with check (
    exists (
      select 1 from public.agencies
      where agencies.id = workflows.agency_id
      and agencies.owner_id = auth.uid()
    )
  );

create policy "Workflows updatable by agency owner"
  on public.workflows for update
  using (
    exists (
      select 1 from public.agencies
      where agencies.id = workflows.agency_id
      and agencies.owner_id = auth.uid()
    )
  );

create policy "Workflows deletable by agency owner"
  on public.workflows for delete
  using (
    exists (
      select 1 from public.agencies
      where agencies.id = workflows.agency_id
      and agencies.owner_id = auth.uid()
    )
  );

-- 3.6 workflow_runs: scoped via client → agency
create policy "Runs readable by agency members"
  on public.workflow_runs for select
  using (
    exists (
      select 1 from public.clients
      join public.agencies on agencies.id = clients.agency_id
      where clients.id = workflow_runs.client_id
      and (agencies.owner_id = auth.uid())
    )
    or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Runs insertable by agency members"
  on public.workflow_runs for insert
  with check (
    exists (
      select 1 from public.clients
      join public.agencies on agencies.id = clients.agency_id
      where clients.id = workflow_runs.client_id
      and agencies.owner_id = auth.uid()
    )
  );

-- 3.7 agent_outputs: scoped via workflow_run → client → agency
create policy "Outputs readable by agency members"
  on public.agent_outputs for select
  using (
    exists (
      select 1 from public.workflow_runs
      join public.clients on clients.id = workflow_runs.client_id
      join public.agencies on agencies.id = clients.agency_id
      where workflow_runs.id = agent_outputs.workflow_run_id
      and (agencies.owner_id = auth.uid())
    )
    or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 3.8 conversations: scoped via client → agency
create policy "Conversations readable by agency members"
  on public.conversations for select
  using (
    exists (
      select 1 from public.clients
      join public.agencies on agencies.id = clients.agency_id
      where clients.id = conversations.client_id
      and (agencies.owner_id = auth.uid() or conversations.user_id = auth.uid())
    )
    or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Conversations insertable by authenticated users"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Conversations updatable by participants"
  on public.conversations for update
  using (auth.uid() = user_id);

-- 3.9 reports: scoped via client → agency
create policy "Reports readable by agency members"
  on public.reports for select
  using (
    exists (
      select 1 from public.clients
      join public.agencies on agencies.id = clients.agency_id
      where clients.id = reports.client_id
      and (agencies.owner_id = auth.uid())
    )
    or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- 4. Triggers (updated_at)
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_conversations_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- ============================================================
-- 5. Auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(new.raw_user_meta_data ->> 'role', 'client')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
