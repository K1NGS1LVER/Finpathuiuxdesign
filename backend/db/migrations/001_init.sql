-- ============================================================
-- FinPath — Initial schema (Phase 1)
-- Run in Supabase SQL editor against your project.
-- Idempotent: safe to re-run.
-- ============================================================

-- ── profiles ────────────────────────────────────────────────
-- One row per user. data is the full FinancialProfile JSON
-- (mirrors the Zustand persisted "finpath-store" payload).
create table if not exists public.profiles (
    user_id        uuid primary key references auth.users(id) on delete cascade,
    data           jsonb not null default '{}'::jsonb,
    storage_mode   text not null default 'local'
                   check (storage_mode in ('local', 'cloud')),
    schema_version integer not null default 3,
    updated_at     timestamptz not null default now()
);

create index if not exists profiles_updated_at_idx
    on public.profiles (updated_at desc);

-- ── chat_history ────────────────────────────────────────────
-- Persistent Penny conversations. Phase 3 (LangGraph) populates
-- tool_calls / tool_results; Phase 1 only inserts role/content.
create table if not exists public.chat_history (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references auth.users(id) on delete cascade,
    role         text not null check (role in ('user', 'assistant', 'system', 'tool')),
    content      text not null,
    tool_calls   jsonb,
    tool_results jsonb,
    created_at   timestamptz not null default now()
);

create index if not exists chat_history_user_created_idx
    on public.chat_history (user_id, created_at desc);

-- ── proposals ───────────────────────────────────────────────
-- Penny's suggested store mutations awaiting user approval.
-- Phase 3 inserts these via the propose_change tool.
create table if not exists public.proposals (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade,
    action      text not null,
    payload     jsonb not null,
    rationale   text,
    status      text not null default 'pending'
                check (status in ('pending', 'approved', 'rejected', 'expired')),
    created_at  timestamptz not null default now(),
    resolved_at timestamptz
);

create index if not exists proposals_user_status_idx
    on public.proposals (user_id, status, created_at desc);

-- ── updated_at trigger for profiles ─────────────────────────
create or replace function public.set_updated_at() returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
    before update on public.profiles
    for each row
    execute function public.set_updated_at();

-- ── Row Level Security ──────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.chat_history  enable row level security;
alter table public.proposals     enable row level security;

drop policy if exists "profiles owner crud"     on public.profiles;
drop policy if exists "chat_history owner crud" on public.chat_history;
drop policy if exists "proposals owner crud"    on public.proposals;

create policy "profiles owner crud"
    on public.profiles for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "chat_history owner crud"
    on public.chat_history for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "proposals owner crud"
    on public.proposals for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
