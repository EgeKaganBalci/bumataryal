-- ============================================
-- Açıklama alanı ekleme (V2.1)
-- Supabase SQL Editor'da çalıştır.
-- ============================================

-- materials tablosuna açıklama kolonu ekle
alter table public.materials add column if not exists aciklama text;

-- Görünümü açıklama içerecek şekilde güncelle
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
