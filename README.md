# VBK Summit — Prompt Battle

React + Vite + Supabase ile çalışan canlı prompt battle.

## Kurulum

### 1. Veritabanı
Supabase Dashboard → **SQL Editor** → `supabase/battle_schema.sql` içeriğini yapıştır → **Run**.
Tekrar çalıştırılabilir; mevcut projede eksik kolon ve kuralları tamamlar.

### 2. .env dosyası
```bash
cp .env.example .env
```
Supabase Dashboard → **Project Settings → API Keys** sayfasından:
- Project URL → `VITE_SUPABASE_URL`
- Publishable key (`sb_publishable_...`) → `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_PIN` → admin sayfaları için 4 haneli PIN

### 3. Çalıştır
```bash
npm install
npm run dev
```

Açılır: http://localhost:3000/vbk/

---

## URL Yapısı

| URL | Açıklama |
|-----|----------|
| `#/battle/join` | Katılımcı ekranı — isim + prompt gönderme |
| `#/battle` | Büyük ekran — projektöre açılır |
| `#/a/battle` | Admin — tur başlat, output gir, seç, sun, kazananı belirle (PIN) |
| `#/panel` | Admin menüsü (PIN) |

## Akış

1. Admin görevi yazıp **Turu Başlat**'a basar.
2. Katılımcılar promptlarını gönderir; admin her promptun AI çıktısını elle girip 💾 ile kaydeder.
3. Admin promptları seçip sıralar, **Sunumu Başlat** ile büyük ekranda tek tek gösterir.
4. Admin kazananı seçer; büyük ekranda ve katılımcı ekranlarında kazanan görünür.

## Deploy

`main`'e push → GitHub Actions ile GitHub Pages. Repo secrets:
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_PIN`.
