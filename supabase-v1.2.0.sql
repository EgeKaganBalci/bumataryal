-- ============================================
-- v1.2.0 — Rol sistemi, admin paneli, ban sistemi
-- Supabase SQL Editor'da çalıştır.
-- ============================================

-- 1. profiles tablosuna rol ve ban kolonları ekle
alter table public.profiles add column if not exists role text default 'member' check (role in ('founder', 'admin', 'member'));
alter table public.profiles add column if not exists is_banned boolean default false;
alter table public.profiles add column if not exists ban_reason text;
alter table public.profiles add column if not exists banned_at timestamp with time zone;
alter table public.profiles add column if not exists banned_by uuid references public.profiles(id);

-- 2. Kurucuyu ata
update public.profiles set role = 'founder' where id = '679411e0-1d25-4693-abd3-fa1700e9bff0';

-- 3. Loglar tablosu
create table if not exists public.logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text,
  event_type text not null,
  target_id text,
  target_name text,
  detail text
);

alter table public.logs enable row level security;
create policy "logs_select" on public.logs for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('founder', 'admin'))
);
create policy "logs_insert" on public.logs for insert with check (auth.uid() is not null);

-- 4. RLS güncellemeleri — admin/kurucu her notu silebilir/düzenleyebilir
drop policy if exists "materials_update" on public.materials;
drop policy if exists "materials_delete" on public.materials;

create policy "materials_update" on public.materials for update using (
  auth.uid() = uploader_id or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('founder', 'admin'))
);
create policy "materials_delete" on public.materials for delete using (
  auth.uid() = uploader_id or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('founder', 'admin'))
);

-- 5. Profil güncelleme — admin/kurucu başkasını banLayabilir
drop policy if exists "Kullanıcı kendi profilini güncelleyebilir" on public.profiles;
create policy "profiles_update" on public.profiles for update using (
  auth.uid() = id or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('founder', 'admin'))
);

-- 6. materials_with_stats görünümünü güncelle
-- Admin/kurucu anonim notların sahibini görebilir
drop view if exists public.materials_with_stats;

create view public.materials_with_stats as
select
  m.id, m.created_at, m.baslik, m.ders_kodu, m.donem, m.is_anonymous, m.aciklama, m.indirme_sayisi,
  case
    when not m.is_anonymous then m.uploader_id
    when exists (select 1 from public.profiles where id = auth.uid() and role in ('founder', 'admin'))
    then m.uploader_id
    when m.uploader_id = auth.uid() then m.uploader_id
    else null
  end as uploader_id,
  case
    when not m.is_anonymous then p.display_name
    when exists (select 1 from public.profiles where id = auth.uid() and role in ('founder', 'admin'))
    then p.display_name
    when m.uploader_id = auth.uid() then p.display_name
    else null
  end as uploader_name,
  m.is_anonymous and not exists (
    select 1 from public.profiles where id = auth.uid() and role in ('founder', 'admin')
  ) and m.uploader_id != auth.uid() as is_hidden_anon,
  coalesce(v.likes, 0) as likes,
  coalesce(v.dislikes, 0) as dislikes,
  coalesce(f.file_count, 0) as file_count
from public.materials m
left join public.profiles p on p.id = m.uploader_id
left join (
  select material_id,
    sum(case when value = 1 then 1 else 0 end)::int as likes,
    sum(case when value = -1 then 1 else 0 end)::int as dislikes
  from public.votes group by material_id
) v on v.material_id = m.id
left join (
  select material_id, count(*)::int as file_count
  from public.material_files group by material_id
) f on f.material_id = m.id;

alter view public.materials_with_stats set (security_invoker = on);
grant select on public.materials_with_stats to anon, authenticated;
