-- ============================================================
-- FIND — Field Insights & Notes Dashboard
-- Skema Supabase (Postgres) + Row Level Security
-- Jalankan seluruh isi berkas ini sekali di Supabase → SQL Editor.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Enum ----------
do $$ begin create type find_role as enum ('field','mle','admin');
exception when duplicate_object then null; end $$;

do $$ begin create type find_status as enum ('draft','submitted');
exception when duplicate_object then null; end $$;

-- ---------- Profil pengguna ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  name       text not null default '',
  role       find_role not null default 'field',
  created_at timestamptz not null default now()
);

-- ---------- Catatan lapangan (struktur A–D template TF v2) ----------
create table if not exists public.notes (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.profiles(id) on delete cascade,
  status       find_status not null default 'draft',

  -- A. Identifikasi kegiatan
  judul        text not null default '',
  tgl_kegiatan date,
  tgl_selesai  date,
  kabkota      text not null default '',
  kecdesa      text not null default '',
  institusi    text not null default '',
  email_tf     text not null default '',
  dept_level   text not null default 'Nasional',
  dept_unit    text not null default '',
  dept_lain    text not null default '',
  program      text not null default '',
  program_lain text not null default '',
  jenis        text not null default '',
  jenis_lain   text not null default '',
  -- [{nama, jabatan, instansi}]
  pihak        jsonb not null default '[]'::jsonb,
  tujuan       text not null default '',
  alasan       text not null default '',

  -- B. Ringkasan
  ringkasan    text not null default '',

  -- C. Catatan observasi — {pelaksanaan:{f,i}, respons:{f,i}, konteks:{f,i}}
  obs          jsonb not null default
               '{"pelaksanaan":{"f":"","i":""},"respons":{"f":"","i":""},"konteks":{"f":"","i":""}}'::jsonb,

  -- D. Rencana tindak lanjut — [{aksi, pic, target, status}]
  rtl          jsonb not null default '[]'::jsonb,

  -- Insight AI tersimpan — {text, at, scope}
  ai           jsonb,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists notes_author_idx  on public.notes(author_id);
create index if not exists notes_tanggal_idx on public.notes(tgl_kegiatan desc nulls last);
create index if not exists notes_program_idx on public.notes(program);
create index if not exists notes_status_idx  on public.notes(status);

-- ---------- updated_at otomatis ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists notes_touch on public.notes;
create trigger notes_touch before update on public.notes
  for each row execute function public.touch_updated_at();

-- ---------- Profil dibuat otomatis saat user Supabase Auth dibuat ----------
-- Pengguna pertama otomatis menjadi administrator.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare jml int;
begin
  select count(*) into jml from public.profiles;
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    case when jml = 0 then 'admin'::find_role
         else coalesce((new.raw_user_meta_data->>'role')::find_role, 'field'::find_role) end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Helper peran ----------
-- security definer supaya pembacaan peran tidak memicu RLS profiles secara rekursif.
create or replace function public.find_role_of(uid uuid)
returns find_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = uid
$$;

create or replace function public.can_view_all()
returns boolean language sql stable as $$
  select public.find_role_of(auth.uid()) in ('mle','admin')
$$;

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.notes    enable row level security;

-- profiles
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select
  using (id = auth.uid() or public.can_view_all());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles for all
  using (public.find_role_of(auth.uid()) = 'admin')
  with check (public.find_role_of(auth.uid()) = 'admin');

-- notes: Field Officer hanya catatannya sendiri; MLE Analyst & Administrator seluruhnya
drop policy if exists notes_read on public.notes;
create policy notes_read on public.notes for select
  using (author_id = auth.uid() or public.can_view_all());

drop policy if exists notes_insert on public.notes;
create policy notes_insert on public.notes for insert
  with check (author_id = auth.uid());

drop policy if exists notes_update on public.notes;
create policy notes_update on public.notes for update
  using (author_id = auth.uid() or public.can_view_all())
  with check (author_id = auth.uid() or public.can_view_all());

drop policy if exists notes_delete on public.notes;
create policy notes_delete on public.notes for delete
  using (author_id = auth.uid() or public.find_role_of(auth.uid()) = 'admin');
