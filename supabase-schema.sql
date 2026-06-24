-- Profiles tablosu (auth.users ile bağlantılı)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  created_at timestamp with time zone default now()
);

-- Materials tablosu
create table public.materials (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  uploader_id uuid references public.profiles(id) on delete set null,
  ders_kodu text not null,
  ders_adi text not null,
  tur text not null check (tur in ('Föy', 'Vize', 'Final', 'Ödev', 'Quiz', 'Diğer')),
  fakulte text not null,
  bolum text not null,
  donem text not null,
  aciklama text,
  dosya_url text,
  dosya_adi text,
  indirme_sayisi integer default 0
);

-- Storage bucket
insert into storage.buckets (id, name, public) values ('materials', 'materials', true);

-- RLS: profiles
alter table public.profiles enable row level security;
create policy "Herkes profilleri görebilir" on public.profiles for select using (true);
create policy "Kullanıcı kendi profilini oluşturabilir" on public.profiles for insert with check (auth.uid() = id);
create policy "Kullanıcı kendi profilini güncelleyebilir" on public.profiles for update using (auth.uid() = id);

-- RLS: materials
alter table public.materials enable row level security;
create policy "Herkes materyalleri görebilir" on public.materials for select using (true);
create policy "Giriş yapanlar materyal ekleyebilir" on public.materials for insert with check (auth.uid() is not null);
create policy "Yükleyen kendi materyalini güncelleyebilir" on public.materials for update using (auth.uid() = uploader_id);
create policy "Yükleyen kendi materyalini silebilir" on public.materials for delete using (auth.uid() = uploader_id);

-- RLS: storage
create policy "Herkes dosyaları indirebilir" on storage.objects for select using (bucket_id = 'materials');
create policy "Giriş yapanlar dosya yükleyebilir" on storage.objects for insert with check (bucket_id = 'materials' and auth.uid() is not null);
create policy "Yükleyen kendi dosyasını silebilir" on storage.objects for delete using (bucket_id = 'materials' and auth.uid() = owner);

-- Yeni kullanıcı kaydında otomatik profil oluştur
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
