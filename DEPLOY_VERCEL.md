# Deploy Larisk Admin ke Vercel — 1 Menit (Paling Mudah)

Dashboard ini **sudah Vercel-ready** (Next 16 + Turbopack, `vercel.json` + `.nvmrc` sudah ada). Tidak perlu setting build manual.

## Opsi A: Paling Gampang — via Dashboard Vercel (tanpa CLI)

1. **Push ke GitHub**
   ```bash
   cd /Users/ricad/Projects/larisk-admin
   git init && git add . && git commit -m "feat: larisk admin ready for vercel"
   # buat repo private di github.com/new lalu:
   git remote add origin https://github.com/<username>/larisk-admin.git
   git push -u origin main
   ```

2. **Import di Vercel**
   - Buka https://vercel.com/new → Import `larisk-admin` repo
   - Framework akan auto `Next.js`, Build `npm run build`, Output `.next` (sudah di `vercel.json`)
   - **JANGAN deploy dulu** — set env dulu:

3. **Set Env (Wajib 1 env saja)**
   - Project → Settings → Environment Variables → Add:
     - `NEXT_PUBLIC_API_URL` = `https://organicismal-rapaciously-kennith.ngrok-free.dev` (atau domain Laravel prod kamu, **tanpa** `/api/v1`, tanpa trailing `/`)
     - Centang `Production, Preview, Development` → Save
   - Untuk lokal tetap `http://localhost:8001` (cukup di `.env` lokal, tidak perlu di Vercel)

4. **Deploy**
   - Klik **Deploy** → tunggu 2 menit → dapat URL `https://larisk-admin-xxx.vercel.app`
   - Login: `admin@larisk.id` / `admin123`

5. **Ganti Backend nanti (tanpa redeploy manual)**
   - Ganti `NEXT_PUBLIC_API_URL` di Vercel Dashboard → **Redeploy** (Deployments → ⋯ → Redeploy) atau push commit baru.

## Opsi B: Via CLI (1 baris)

```bash
npm i -g vercel
vercel --prod
# jawab: Set up? Y, link ke project, set env NEXT_PUBLIC_API_URL saat diminta
# atau set env terpisah:
vercel env add NEXT_PUBLIC_API_URL production
# isi: https://organicismal-rapaciously-kennith.ngrok-free.dev
vercel --prod
```

## Checklist Biar Tidak Gagal

- [ ] `NEXT_PUBLIC_API_URL` **tanpa** `/api/v1` (contoh benar: `https://api.lariskpos.com`, salah: `https://api.lariskpos.com/api/v1`)
- [ ] Laravel backend `CORS_ALLOWED_ORIGINS` include `https://*.vercel.app` (sudah `*` → aman) & `APP_URL` = ngrok/prod domain
- [ ] Jika ngrok free, URL ganti tiap restart — update env di Vercel & Redeploy
- [ ] Node 20 (sudah di `.nvmrc`) — Vercel auto pakai 20

## Rollback / Update

Push ke `main` auto-deploy Preview. Promote ke Production di Deployments → Promote.

## Butuh Domain Sendiri?

Vercel → Settings → Domains → Add `admin.lariskpos.com` → set CNAME di Cloudflare → auto HTTPS.

---
**Sudah include:** `vercel.json` (region `sin1` Singapore biar dekat), `.nvmrc` (Node 20), `.vercelignore`, `next.config.ts` optimized.
