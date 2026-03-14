# Zirve Snack Gamification

React + Vite + Supabase ile çalışan QR tabanlı soru-cevap ve puan sistemi.

## Kurulum (15 dakika)

### 1. Supabase projesi oluştur
1. [supabase.com](https://supabase.com) → New Project
2. Proje adı: `zirve-gamification`
3. Database Password'ü kaydet
4. Region: **eu-central-1** (Frankfurt — Türkiye'ye en yakın)

### 2. Veritabanı schema'yı çalıştır
1. Supabase Dashboard → **SQL Editor**
2. `supabase/schema.sql` dosyasının içeriğini yapıştır → **Run**
3. Demo veriler otomatik eklenir

### 3. `increment_points` fonksiyonunu ekle (opsiyonel ama önerilen)
SQL Editor'de çalıştır:
```sql
create or replace function increment_points(player_id uuid, amount int)
returns void as $$
  update players set total_points = total_points + amount where id = player_id;
$$ language sql;
```

### 4. .env.local dosyasını oluştur
```bash
cp .env.example .env.local
```
Supabase Dashboard → **Project Settings → API** sayfasından:
- `Project URL` → `VITE_SUPABASE_URL`
- `anon public` key → `VITE_SUPABASE_ANON_KEY`

### 5. Çalıştır
```bash
npm install
npm run dev
```

Açılır: http://localhost:3000

---

## URL Yapısı

| URL | Açıklama |
|-----|----------|
| `/q/:stationId` | Katılımcı soru ekranı — QR bu URL'e yönlendirir |
| `/admin` | Soru ekleme, QR üretme, istatistikler |
| `/leaderboard` | Canlı sıralama — büyük ekrana açılır |

## QR Kodlar

Admin panelinde her stand için **QR Üret** butonuna tıkla.
Gerçek QR kodu için `qrcode` paketi ekle:
```bash
npm install qrcode
```
`src/components/QRCode.jsx` içinde yorum satırını aç.

## Deploy (Vercel)

```bash
npm install -g vercel
vercel --prod
```

Vercel dashboard'da environment variables ekle:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Diğer Modüller

Bu proje snack gamification modülüdür. Diğer modüller:
- **Prompt Battle** — A/B prompt karşılaştırma ekranı
- **Networking Matchmaking** — ilgi alanı bazlı eşleştirme
- **Slido benzeri Q&A** — oturum arası etkileşim
- **QR Yoklama** — sertifika için katılım takibi
