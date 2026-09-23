# LarisK Admin — Super Admin Dashboard (Next.js + Laravel API)

Dashboard **full-integrated** untuk mengelola **user/owner, daftar toko/bisnis, transaksi tagihan, dan kirim notifikasi** — terhubung langsung ke API Laravel `larisk` (`/api/v1`, Sanctum Bearer, deploy Vercel).

## Menu & Endpoint

| Menu | Next.js Route | Laravel API |
|---|---|---|
| Dashboard Overview | `/dashboard` | `GET /api/v1/admin/stats` |
| Kelola User | `/users` | `GET /admin/users`, `POST /admin/users/{id}/toggle-active`, `POST /admin/users/{id}/reset-pin`, `POST /admin/users/{id}/toggle-admin` |
| Daftar Toko / Bisnis | `/stores` | `GET /admin/businesses`, `POST /admin/businesses/{id}/toggle-active` |
| Transaksi Tagihan | `/billing` | `GET /admin/invoices` |
| Kirim Notifikasi | `/notifications` | `GET/POST /admin/notifications` (global `audience=all` via Expo Push) |

Semua endpoint admin ada di `larisk/routes/api/v1.php` dengan middleware `auth:sanctum` + `is_admin` (tanpa `business.context`).

## Setup Lokal

### 1. Laravel (`User/Project/larisk`)

```bash
# Migration is_admin
php artisan migrate --force   # atau docker compose exec app php artisan migrate

# Buat super admin (is_admin=true)
php artisan admin:make --phone=081234567890 --pin=123456 --name="Super Admin"
# Output: token Bearer — bisa langsung pakai, atau login via phone+pin di dashboard

# (Opsional) Set CORS agar Vercel bisa akses
# .env: CORS_ALLOWED_ORIGINS=https://larisk-admin.vercel.app,http://localhost:3000
# Jika * (default) sudah allow all.

# Jalankan backend
php artisan serve  # atau docker compose up -d
php artisan serve --host=0.0.0.0 --port=8000  # untuk ngrok
ngrok http 8000  # jika ingin diakses Vercel preview
```

Endpoint yang ditambahkan:
- `app/Http/Middleware/EnsureAdmin.php`
- `app/Http/Controllers/Api/V1/Admin/{Dashboard,User,Business,Invoice,Notification}Controller.php`
- `app/Console/Commands/MakeAdmin.php`
- `config/cors.php`
- `database/migrations/2026_09_21_000001_add_is_admin_to_users_table.php`
- `bootstrap/app.php` alias `is_admin`

### 2. Next.js (`larisk-admin`)

```bash
npm install
cp .env.example .env
# edit .env:
# NEXT_PUBLIC_API_URL=http://localhost:8000            # lokal
# atau
# NEXT_PUBLIC_API_URL=https://organicismal-rapaciously-kennith.ngrok-free.dev  # ngrok kamu sekarang

npm run dev   # http://localhost:3000 → /dashboard (guard ke /login jika belum token)
npm run build # cek build
```

Login di `/login`:
- Phone + PIN admin yang dibuat via `admin:make`
- Jika backend belum running, PIN `123456` bisa masuk mode **MOCK** (fallback data) — tetap bisa demo UI

### 3. Deploy Vercel

1. Push `larisk-admin` ke GitHub
2. Import di https://vercel.com/new
3. Env: `NEXT_PUBLIC_API_URL=https://domain-laravel-produksi.com` (tanpa `/api/v1`)
4. Deploy — Next.js auto-detected (Turbopack)

Laravel di production (Dokploy/VPS): pastikan `APP_URL` dan `CORS_ALLOWED_ORIGINS` terisi domain Vercel, lalu `php artisan migrate`.

## Auth Flow

1. `POST /api/v1/auth/login {phone,pin}` → `{data:{token}}` (Sanctum abilities=`*` untuk admin)
2. Token disimpan di `localStorage:larisk_admin_token`
3. Semua `apiFetch("/admin/...")` attach `Authorization: Bearer <token>`
4. Jika 401/403 → redirect `/login` / tampil fallback mock

## Struktur Next.js

```
app/(dashboard)/dashboard  # stats + bisnis terbaru + invoice
app/(dashboard)/users      # pagination, search, toggle aktif, reset PIN, toggle admin
app/(dashboard)/stores     # cards, filter status subscription
app/(dashboard)/billing    # table invoice + pagination
app/(dashboard)/notifications  # broadcast + history
app/(auth)/login
lib/api.ts   # fetch wrapper BASE=/api/v1 + Bearer
lib/auth.ts  # useAuth hook
components/layout, components/ui
```
