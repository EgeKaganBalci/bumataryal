-- ============================================
-- BÜ Materyal — V2 Şema Güncellemesi
-- Çoklu dosya + beğeni/beğenmeme + anonim + kategorisiz
-- DİKKAT: Eski materyaller silinecek (test verileri).
-- Supabase SQL Editor'da çalıştır.
-- ============================================

-- Eski materials tablosunu temizle
drop view if exists public.materials_with_stats cascade;
drop table if exists public.materials cascade;

-- Materials: her kayıt bir paylaşım (birden çok dosya içerebilir)
create table public.materials (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  uploader_id uuid references public.profiles(id) on delete set null,
  baslik text not null,
  ders_kodu text not null,
  donem text,
  aciklama text,
  is_anonymous boolean default false
);

-- Bir paylaşıma ait dosyalar
create table public.material_files (
  id uuid default gen_random_uuid() primary key,
  material_id uuid references public.materials(id) on delete cascade not null,
  dosya_url text not null,
  dosya_adi text not null,
  created_at timestamp with time zone default now()
);

-- Beğeni / beğenmeme (kullanıcı başına tek oy)
create table public.votes (
  material_id uuid references public.materials(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  value smallint not null check (value in (1, -1)),
  created_at timestamp with time zone default now(),
  primary key (material_id, user_id)
);

-- ---- RLS: materials ----
alter table public.materials enable row level security;
create policy "materials_select" on public.materials for select using (true);
create policy "materials_insert" on public.materials for insert with check (auth.uid() = uploader_id);
create policy "materials_update" on public.materials for update using (auth.uid() = uploader_id);
create policy "materials_delete" on public.materials for delete using (auth.uid() = uploader_id);

-- ---- RLS: material_files ----
alter table public.material_files enable row level security;
create policy "files_select" on public.material_files for select using (true);
create policy "files_insert" on public.material_files for insert with check (
  auth.uid() is not null and
  exists (select 1 from public.materials m where m.id = material_id and m.uploader_id = auth.uid())
);
create policy "files_delete" on public.material_files for delete using (
  exists (select 1 from public.materials m where m.id = material_id and m.uploader_id = auth.uid())
);

-- ---- RLS: votes ----
alter table public.votes enable row level security;
create policy "votes_select" on public.votes for select using (true);
create policy "votes_insert" on public.votes for insert with check (auth.uid() = user_id);
create policy "votes_update" on public.votes for update using (auth.uid() = user_id);
create policy "votes_delete" on public.votes for delete using (auth.uid() = user_id);

-- ---- İstatistikli görünüm (beğeni sayıları + dosya sayısı + paylaşan adı) ----
create or replace view public.materials_with_stats as
select
  m.id, m.created_at, m.uploader_id, m.baslik, m.ders_kodu, m.donem, m.is_anonymous, m.aciklama,
  case when m.is_anonymous then null else p.display_name end as uploader_name,
  coalesce(sum(case when v.value = 1 then 1 else 0 end), 0)::int as likes,
  coalesce(sum(case when v.value = -1 then 1 else 0 end), 0)::int as dislikes,
  count(distinct f.id)::int as file_count
from public.materials m
left join public.profiles p on p.id = m.uploader_id
left join public.votes v on v.material_id = m.id
left join public.material_files f on f.material_id = m.id
group by m.id, p.display_name;

alter view public.materials_with_stats set (security_invoker = on);
grant select on public.materials_with_stats to anon, authenticated;
