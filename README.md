# BÜ Materyal — Başkent Üniversitesi Not Paylaşım Platformu

Next.js + Supabase + Vercel ile geliştirilmiş öğrenci ders notu paylaşım platformu.

## Özellikler

- Tablo görünümü: Başlık | Ders Kodu | Dönem | Paylaşan | Tarih | Beğeni | İşlemler
- Çoklu dosya yükleme (PDF, DOC, DOCX, PPTX)
- Açıklama alanı (1000 karakter, detay sayfasında görünür)
- Beğeni / beğenmeme (kayıtlı kullanıcılar)
- Anonim paylaşım seçeneği
- Ders kodu otomatik düzeltme ("eem 301" -> "EEM301")
- Sayfalama (her sayfada 20 not)
- Detay sayfasında dosyaları tek tek indirme
- Yükleyen için düzenleme + silme

## Kurulum

### 1. Veritabanı (Supabase)
Supabase Dashboard -> SQL Editor -> `supabase-schema.sql` dosyasını çalıştır.
(Sıfırdan kurulum için. Mevcut kurulumda sadece yeni değişiklikleri çalıştırmak yeterli.)

### 2. Environment Variables (Vercel)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Deploy
GitHub'a push -> Vercel otomatik deploy eder.

## Lokal geliştirme
```bash
npm install
npm run dev
```
