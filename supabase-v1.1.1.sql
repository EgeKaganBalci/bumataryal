-- ============================================
-- v1.1.1 — İndirme sayısı takibi
-- materials tablosuna indirme sayacı + güvenli artırma fonksiyonu
-- Supabase SQL Editor'da çalıştır.
-- ============================================

-- 1. İndirme sayacı kolonu
alter table public.materials add column if not exists indirme_sayisi int default 0;

-- 2. Sayacı güvenli artıran fonksiyon (herkes çağırabilir, sadece +1 yapar)
create or replace function public.increment_download(mat_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.materials set indirme_sayisi = indirme_sayisi + 1 where id = mat_id;
$$;

grant execute on function public.increment_download(uuid) to anon, authenticated;

-- 3. Görünümü indirme sayısını içerecek şekilde güncelle
drop view if exists public.materials_with_stats;

create view public.materials_with_stats as
select
  m.id, m.created_at, m.baslik, m.ders_kodu, m.donem, m.is_anonymous, m.aciklama, m.indirme_sayisi,
  case when m.is_anonymous and (m.uploader_id is distinct from auth.uid())
       then null else m.uploader_id end as uploader_id,
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
