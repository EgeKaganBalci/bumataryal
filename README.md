# BÜ Materyal — Başkent Üniversitesi Not Paylaşım Platformu

## V2 Güncellemesi — Değişiklikler

- Tablo görünümü: Başlık | Ders Kodu | Dönem | Paylaşan | Tarih | Beğeni | İşlemler
- Çoklu dosya yükleme (tek paylaşımda birden fazla PDF/DOC/DOCX/PPTX)
- Beğeni / beğenmeme (kayıtlı kullanıcılar, herkese açık)
- Anonim paylaşım seçeneği
- Kategoriler kaldırıldı (sadece "not")
- Ders kodu otomatik düzeltme ("eem 301" -> "EEM301")
- Sayfalama (her sayfada 20 not)
- Detay sayfasında dosyaları tek tek indirme
- Yükleyen için düzenleme + silme

## ÖNEMLİ: Veritabanını güncelle

V2 için yeni tablolar gerekli. Supabase Dashboard -> SQL Editor -> aşağıdaki dosyayı yapıştır ve çalıştır:

```
supabase-schema-v2.sql
```

DİKKAT: Bu işlem eski test materyallerini siler (yeni yapı farklı). Profil/kullanıcılar korunur.

## Deploy

Kod GitHub'a push edilince Vercel otomatik yeniden deploy eder. Environment variable'lar aynı kalır.

## Lokal geliştirme

```bash
npm install
npm run dev
```
