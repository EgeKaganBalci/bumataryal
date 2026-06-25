# BÜ Materyal — Başkent Üniversitesi Not Paylaşım Platformu

Başkent Üniversitesi öğrencilerinin ders notlarını, föyleri, sınav ve ödevleri
paylaşıp indirebildiği web platformu. Notları herkes görüntüleyip indirebilir;
yükleme, düzenleme ve beğeni için hesap gerekir.

**Teknolojiler:** Next.js (App Router) · Supabase (Auth + DB + Storage) · Vercel

---

## Sürüm Standardı

Sürümler `vX.Y.Z` formatındadır:
- **X** — Büyük güncellemeler, tüm sistemi etkileyen
- **Y** — Orta boyutlu güncellemeler, yeni özellikler vb.
- **Z** — Küçük boyutlu güncellemeler, bugfix veya UI vb.

---

## Değişiklik Geçmişi (Changelog)

### v1.1.3 — Dosya tipi ikonları ve filtre temizleme
- **Dosya tipi ikonları:** Detay sayfasında her dosyanın türü (PDF, DOC, PPT)
  renkli ikon ve etiketle gösteriliyor. PDF kırmızı, Word mavi, PowerPoint turuncu.
- **Filtre temizleme:** Arama kutularının içine X butonu eklendi (tıklayınca o
  filtreyi temizler). Aktif filtreler mavi etiket olarak listenin üstünde görünür
  ve tek tıkla kaldırılabilir. "Tümünü temizle" bağlantısı da var.

### v1.1.2 — İndirme sayacı düzeltmesi
- İndirme butonuna basıldığında sayaç bazen veritabanına yazılmadan sayfa
  yenilenince sıfırlanıyordu. Buton artık önce sayacı kaydedip sonra dosyayı
  açıyor; indirme sayısı kalıcı oluyor.

### v1.1.1 — İndirme takibi ve mobil görünüm
- **İndirme sayısı:** Her notun kaç kez indirildiği sayılıp listede ve detay
  sayfasında gösteriliyor.
- **Mobil görünüm:** Telefonda liste artık yatay kaydırmalı tablo yerine
  dikey kart düzeninde gösteriliyor (parmak dostu). Masaüstünde tablo korunuyor.

### v1.1.0 — Profil ve anonimlik geliştirmeleri
- **Ders koduna tıklama:** Tablodaki ders koduna tıklayınca o ders otomatik filtrelenir.
- **Profil sayfası:** Kullanıcı adına tıklayınca o kişinin paylaşımları listelenir.
  - Kişi kendi profilinde tüm yüklemelerini görür (anonim olanlar rozetle işaretli).
  - Başkaları sadece anonim olmayan paylaşımları görür; anonimlik veritabanı
    seviyesinde korunur (anonim notların sahibi başkalarına gönderilmez).
- **Hesap ayarları:** Navbar'a ayar (çark) butonu eklendi. Kullanıcı adı ve şifre
  buradan değiştirilebilir.
- **Navbar:** Kullanıcı adı artık profile bağlanıyor.

### v1.0.0 — İlk sürüm
- Tablo görünümü: Başlık · Ders Kodu · Dönem · Paylaşan · Tarih · Beğeni · İşlemler
- Çoklu dosya yükleme (PDF, DOC, DOCX, PPTX) — tek paylaşımda birden fazla dosya
- Açıklama alanı (1000 karakter), detay sayfasında görünür
- Beğeni / beğenmeme (kayıtlı kullanıcılar, kişi başı tek oy, herkese açık sayı)
- Anonim paylaşım seçeneği (yükleme başına)
- Ders kodu otomatik düzeltme ("eem 301" → "EEM301")
- Sayfalama (her sayfada 20 not, en yeni üstte)
- Detay sayfasında dosyaları tek tek görüntüleme/indirme
- Yükleyen için düzenleme ve silme
- Dönem etiketleri (2020-2021'den 2029-2030'a kadar Güz/Bahar)
- E-posta + şifre ile kayıt/giriş

---

## Kurulum (sıfırdan)

### 1. Veritabanı (Supabase)
Supabase Dashboard → SQL Editor → `supabase-schema.sql` dosyasını çalıştır.
Bu, tüm tabloları, RLS politikalarını ve storage bucket'ı oluşturur.

### 2. Environment Variables (Vercel)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Deploy
GitHub'a push → Vercel otomatik deploy eder.

---

## Mevcut kurulumu güncelleme

Her sürümün getirdiği veritabanı değişikliği varsa, ilgili SQL dosyası pakette bulunur:
- `supabase-add-aciklama.sql` — açıklama alanı (v1.0.0 sonrası eklendi)
- `supabase-v1.1.0.sql` — profil/anonimlik için görünüm güncellemesi

Kodu güncellemek için:
```bash
git add -A
git commit -m "vX.Y.Z"
git push
```

---

## Lokal geliştirme
```bash
npm install
npm run dev
```
