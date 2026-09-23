# Admin API Spec — yang perlu ditambahkan di Laravel `larisk`

Dashboard `larisk-admin` (Next.js, deploy Vercel) mengakses `NEXT_PUBLIC_API_URL/api/v1/...` via Sanctum Bearer.
Saat ini API `larisk` hanya punya endpoint bisnis-scoped (`business.context`). Untuk super admin,
buat prefix **` /api/v1/admin/*`** yang **tidak pakai `business.context` / `check.subscription`**, tapi pakai
middleware **`auth:sanctum` + `is_admin`** (atau `role:super_admin` via Spatie).

## 1. Middleware `is_admin`

```php
// app/Http/Middleware/EnsureAdmin.php
public function handle(Request $request, Closure $next) {
    if (! $request->user()?->is_admin && ! $request->user()?->hasRole('super_admin')) {
        abort(403, 'Forbidden - Admin only');
    }
    return $next($request);
}
```

Tambahkan kolom `users.is_admin boolean default false` atau role Spatie `super_admin`.
Buat seeder: `User::where('phone','08admin')->update(['is_admin'=>true])` + token Sanctum dengan abilities `*`.

Daftarkan:
```php
// bootstrap/app.php atau app/Http/Kernel.php
->alias(['is_admin' => EnsureAdmin::class])
```

## 2. Routes `routes/api/v1.php`

```php
Route::middleware(['auth:sanctum', 'is_admin'])->prefix('admin')->group(function () {
    Route::get('/stats', [Admin\DashboardController::class, 'stats']);
    Route::get('/users', [Admin\UserController::class, 'index']);
    Route::post('/users/{user}/toggle-active', [Admin\UserController::class, 'toggleActive']);
    Route::post('/users/{user}/reset-pin', [Admin\UserController::class, 'resetPin']);

    Route::get('/businesses', [Admin\BusinessController::class, 'index']);
    Route::get('/businesses/{business}', [Admin\BusinessController::class, 'show']);
    Route::post('/businesses/{business}/toggle-active', [Admin\BusinessController::class, 'toggleActive']);

    Route::get('/invoices', [Admin\InvoiceController::class, 'index']);
    Route::get('/notifications', [Admin\NotificationController::class, 'index']);
});
// Notifikasi global sudah ada: POST /api/v1/notifications (audience=all) — tidak perlu duplikat,
// admin cukup pakai endpoint yang sama. History admin bisa pakai GET /admin/notifications
// atau GET /notifications yang sudah ada.
```

## 3. Contoh controller (sketsa)

### `GET /admin/stats`
```php
public function stats() {
    return response()->json(['data' => [
        'total_users' => User::count(),
        'total_businesses' => Business::count(),
        'total_outlets' => Outlet::count(),
        'active_subscriptions' => Subscription::where('status','active')->count(),
        'trialing_subscriptions' => Subscription::where('status','trialing')->count(),
        'expired_subscriptions' => Subscription::where('status','expired')->count(),
        'revenue_month' => Invoice::where('status','paid')->whereMonth('paid_at', now()->month)->sum('amount_idr'),
        'revenue_total' => Invoice::where('status','paid')->sum('amount_idr'),
        'pending_invoices' => Invoice::whereIn('status',['open','pending'])->count(),
        'new_users_7d' => User::where('created_at','>=',now()->subDays(7))->count(),
    ]]);
}
```

### `GET /admin/users` dan `GET /admin/businesses` dan `GET /admin/invoices`
Paginated `?page=&per_page=20&q=&status=&is_active=` — pakai `when($q)` + `select` minimal.
Return envelope `{ data: [...], meta: {current_page, per_page, total, last_page} }`.

## 4. ENV untuk Vercel

Di Vercel → Project `larisk-admin` → Settings → Environment Variables:
- `NEXT_PUBLIC_API_URL` = `https://domain-laravel-kamu.com` (tanpa `/api/v1`)
- Redeploy setelah set.

## 5. Testing

```bash
# Buat admin token
php artisan tinker
>>> $u = User::where('phone','08admin')->first(); $u->is_admin=true; $u->save();
>>> $u->createToken('admin', ['*'])->plainTextToken;

# Test
curl -H "Authorization: Bearer <token>" https://lariskpos.com/api/v1/admin/stats
```

## 6. Status sekarang

Dashboard Next.js sudah siap dengan **mock fallback** — tanpa backend admin pun UI tetap bisa didemo
(setiap page `try { await apiFetch('/admin/...') } catch { useMock }`).
Saat backend admin selesai, hapus mock dan data real akan tampil otomatis.
