
# TukangHub — Marketplace Material Bangunan

Aplikasi web e-commerce production-ready di stack Lovable: **TanStack Start (React 19) + Lovable Cloud (PostgreSQL, Auth, Storage)**. Fungsi setara brief Next.js Anda. Desain Swiss/International Style, mobile-first, SEO-friendly. Data awal kosong (diisi via Admin), rekening bank pakai placeholder yang bisa diubah di Admin Settings.

## Design System (Swiss / International Style)
- **Warna (token semantik di styles.css)**: Primary Magenta `#D63384`, Secondary Green `#22C55E`, Accent Orange `#F97316` & Blue `#3B82F6`, netral putih + skala gray. Semua via design token — tanpa warna hardcoded.
- **Tipografi**: Plus Jakarta Sans (display) + Inter (body) via `@fontsource`. Hierarki kuat, grid-based, banyak white space.
- **Komponen**: shadcn UI, animasi halus (Framer Motion), grid 12 kolom, kartu minimal, border tegas.

## Arsitektur Backend (Lovable Cloud)
- Aktifkan Lovable Cloud (Postgres + Auth + Storage).
- Auth email/password + Google sign-in. Role disimpan di tabel terpisah `user_roles` (enum `app_role`: customer, admin) dengan fungsi `has_role` security-definer (anti privilege-escalation).
- Logika server lewat `createServerFn`; data publik (katalog) lewat server publishable client; data milik user & aksi admin lewat `requireSupabaseAuth` + cek role.
- Storage bucket: `product-images` (publik), `payment-proofs` (privat).

## Skema Database (migrasi + GRANT + RLS)
- `profiles` (id→auth.users, fullname, email, phone, avatar) + trigger auto-create saat signup
- `user_roles` (user_id, role)
- `product_categories` (name, slug, icon)
- `products` (sku, slug, name, description, category_id, brand, price, stock, weight, images[], status)
- `carts` (user_id) & `cart_items` (cart_id, product_id, qty, price)
- `shipping_addresses` (user_id, recipient, phone, province, city, district, village, postal_code, full_address)
- `orders` (order_number `TH-YYYYMMDD-XXXX`, user_id, subtotal, shipping_cost, total, payment_method, courier, tracking_number, status)
- `order_items` (order_id, product_id, qty, price)
- `payment_confirmations` (order_id, transfer_bank, sender_name, amount, proof_image, status)
- `order_status_history` (order_id, status, notes)
- `reviews` (product_id, user_id, rating, comment)
- `site_settings` (bank accounts, banner, kontak — untuk placeholder & CMS), `testimonials`, `faqs`, `articles`
- RLS: produk/kategori publik read; cart/order/address scoped `auth.uid()`; admin akses penuh via `has_role`. GRANT eksplisit tiap tabel.

## Struktur Route (TanStack file-based)
**Publik**: `/` (home), `/products`, `/products/$slug`, `/cart`, `/checkout`, `/payment/$orderNumber`, `/tracking`, `/auth` (login+register+lupa password), `/reset-password`
**Customer** (`_authenticated/`): `/account`, `/account/orders`, `/account/orders/$id`, `/account/address`, `/account/profile`, `/account/password`
**Admin** (`_authenticated/admin/`, gate role admin): `/admin`, `/admin/products`, `/admin/categories`, `/admin/orders`, `/admin/orders/$id`, `/admin/customers`, `/admin/settings`, `/admin/cms`
**SEO**: `/sitemap.xml`, `public/robots.txt`

## Fitur per Tahap (urutan build)

### Tahap A — Fondasi + Publik + Katalog + Cart
1. Aktifkan Cloud, migrasi schema, design system & layout (header/nav/footer Swiss).
2. Homepage: Hero, Keunggulan, Cara Kerja, Produk Terlaris, Kategori, Testimoni, CTA.
3. Katalog: search, filter kategori & harga, sort, pagination.
4. Detail produk: galeri foto, deskripsi, harga, stok, berat, review, produk terkait, tombol Tambah Keranjang / Beli Sekarang.
5. Cart: CRUD penuh (tambah, update qty, hapus, kosongkan), subtotal/estimasi ongkir/total.

### Tahap B — Auth + Checkout + Pembayaran
6. Auth: register, login, logout, lupa password (+ halaman `/reset-password`), Google sign-in.
7. Checkout: form penerima + alamat (provinsi→kelurahan, kode pos), pilihan kurir (JNE/J&T/SiCepat/AnterAja), pilihan bank (BCA/Mandiri/BRI/BNI). Generate `order_number` otomatis di server.
8. Halaman instruksi pembayaran: nomor order, detail bank (placeholder dari site_settings), countdown 24 jam, status MENUNGGU PEMBAYARAN.
9. Upload bukti transfer: nama pengirim, nominal, file ke bucket privat → status MENUNGGU VERIFIKASI.

### Tahap C — Customer Dashboard + Tracking
10. Dashboard: total pesanan, aktif, selesai.
11. Pesanan Saya + detail, Tracking timeline (progress tracker modern: Menunggu Pembayaran → Verifikasi → Diproses → Dikemas → Dikirim → Dalam Perjalanan → Selesai / Ditolak / Dibatalkan).
12. Alamat Saya (CRUD), Profil, Ubah Password.

### Tahap D — Admin Panel
13. Login admin & gate role.
14. Dashboard statistik + grafik (penjualan bulanan, produk terlaris) via Recharts.
15. Kelola Produk (CRUD, upload multi-gambar, stok, harga), Kelola Kategori (CRUD).
16. Kelola Pesanan: list + filter status, detail (data customer, produk, bukti transfer), aksi ACC/Tolak pembayaran (alasan), input kurir + resi, update status.
17. Kelola Customer (data, jumlah transaksi, total pembelian).
18. CMS: banner, testimoni, FAQ, artikel. Settings: rekening bank & kontak.

### Lintas-fitur
- **Notifikasi in-app** (tabel notifications) untuk trigger: registrasi, pesanan dibuat, upload bukti, pembayaran disetujui, dikirim, selesai. Email transaksional via Lovable Email (opsional di iterasi lanjut).
- **SEO**: metadata dinamis per route, Open Graph, JSON-LD (Product/Organization), sitemap, robots.
- **Keamanan**: RBAC via has_role, RLS ketat, validasi Zod client+server, input sanitization, bucket privat untuk bukti transfer.
- **Performa**: lazy loading, image optimization, code splitting, mobile-first.

## Catatan teknis
- Stok berkurang saat order dibuat (transaksi server-side). Order number anti-balapan via sequence harian.
- Estimasi ongkir: tabel tarif sederhana per kurir (flat/berat) — bisa disesuaikan nanti.
- Data produk/kategori kosong; admin mengisi via panel. Rekening bank placeholder tersimpan di `site_settings`.

Mengingat besarnya cakupan, saya akan membangun bertahap A→B→C→D dalam beberapa iterasi, memastikan tiap tahap terintegrasi dan berjalan sebelum lanjut. Iterasi pertama: Tahap A (fondasi + publik + katalog + cart).
