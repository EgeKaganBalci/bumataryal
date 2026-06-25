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

### v1.2.1 — Google Drive linki ekleme
- Yükleme formuna "Drive linki ekle" seçeneği eklendi. Dosya yüklemeyle
  birlikte veya tek başına Drive linki eklenebilir.
- Drive dosyaları detay sayfasında Google Drive ikonu ve "Google Drive"
  etiketiyle ayrı gösterilir; butonu "İndir" değil "Aç" olarak görünür
  ve tıklanınca Drive'da açılır.
- Drive dosyasının "Bağlantıya sahip olan herkes görüntüleyebilir"
  paylaşım ayarında olması gerekir.

### v1.2.0 — Rol sistemi ve yönetim paneli
- Kurucu, admin ve üye rolleri eklendi.
- Navbar'da admin/kurucuya özel kalkan ikonu eklendi, tıklayınca
  yönetim paneli açılır. Normal üyeler paneli göremez.
- Yönetim paneli 5 sekme: Genel Bakış (istatistikler), Kullanıcılar,
  Banlılar, Notlar, Loglar.
- Kurucu istediği kullanıcıya admin yetkisi verip geri alabilir.
- Admin ve kurucu herhangi bir notu düzenleyip silebilir.
- Admin ve kurucu anonim notların sahibini görebilir.
- Ban/unban sistemi: ban sebebi yazılarak kullanıcı askıya alınır.
- Banlı kullanıcı giriş yapmaya çalışınca "Hesabınız askıya alınmıştır.
  Sebep: ..." mesajı çıkar.
- Oturum açıkken banlanan kullanıcının oturumu otomatik kapatılır.
- Loglar: ban, unban, rol değişikliği ve not silme olayları kayıt altına alınır.

### v1.1.4 — Beğeni sayacı düzeltmesi
- Beğeni/beğenmeme butonuna basılınca sayı yanlış görünüyor, F5 ile
  yenilenince farklı bir sayı çıkıyordu. İki ayrı sorun tespit edildi:
  oy işlemi artık önce mevcut oyu silip sonra yenisini ekliyor (tekrar
  kayıt oluşması engellendi); ayrıca veritabanı görünümünde oylar ve
  dosya sayısı aynı grupta hesaplandığı için birbirini çarpıyordu,
  ikisi ayrı subquery'e alındı. F5 gerekmeden her zaman doğru görünüyor.

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
- Tablo görünümü: Başlık · Ders Kodu · Dönem · Paylaşan · Tarih · İndirme · Beğeni · İşlemler
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
- `supabase-v1.1.1.sql` — indirme sayacı ve fonksiyon
- `supabase-v1.2.0.sql` — rol sistemi, ban, loglar, admin paneli

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
