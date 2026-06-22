import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ShieldCheck, ShoppingBag, Users, Package, Wallet, TrendingUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/hooks/use-auth";
import { formatRupiah, formatDate, slugify } from "@/lib/format";
import {
  adminStats, adminListOrders, adminApprovePayment, adminRejectPayment, adminSetShipping, adminUpdateStatus,
  adminListProducts, adminSaveProduct, adminDeleteProduct, adminListCategories, adminSaveCategory, adminDeleteCategory,
  adminListCustomers, adminGetSettings, adminSaveSettings, grantAdminSelf,
} from "@/lib/admin.functions";
import { COURIERS, BANKS } from "@/lib/constants";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Panel — TukangHub" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const grantFn = useServerFn(grantAdminSelf);
  useEffect(() => { if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/admin" } as any }); }, [loading, user, navigate]);

  if (loading) return <div className="p-16 text-center text-muted-foreground">Memuat…</div>;
  if (user && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm rounded-xl border border-border p-8 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-3 font-display text-xl font-bold">Akses Admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">Anda belum memiliki akses admin. Jika ini akun admin pertama, klaim akses di bawah.</p>
          <Button className="mt-4 w-full" onClick={async () => { try { await grantFn(); await refresh(); toast.success("Akses admin diberikan"); } catch (e: any) { toast.error(e?.message ?? "Gagal"); } }}>Klaim Akses Admin</Button>
          <Button asChild variant="ghost" className="mt-2 w-full"><Link to="/">Kembali ke beranda</Link></Button>
        </div>
      </div>
    );
  }
  if (!user) return null;
  return <AdminInner />;
}

function AdminInner() {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b border-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/admin" className="flex items-center gap-2 font-display text-lg font-extrabold">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground">T</span> Admin TukangHub
          </Link>
          <Button asChild variant="secondary" size="sm"><Link to="/">Lihat Toko</Link></Button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Tabs defaultValue="dashboard">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="orders">Pesanan</TabsTrigger>
            <TabsTrigger value="products">Produk</TabsTrigger>
            <TabsTrigger value="categories">Kategori</TabsTrigger>
            <TabsTrigger value="customers">Customer</TabsTrigger>
            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="mt-4"><DashboardTab /></TabsContent>
          <TabsContent value="orders" className="mt-4"><OrdersTab /></TabsContent>
          <TabsContent value="products" className="mt-4"><ProductsTab /></TabsContent>
          <TabsContent value="categories" className="mt-4"><CategoriesTab /></TabsContent>
          <TabsContent value="customers" className="mt-4"><CustomersTab /></TabsContent>
          <TabsContent value="settings" className="mt-4"><SettingsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function DashboardTab() {
  const fn = useServerFn(adminStats);
  const { data } = useQuery({ queryKey: ["admin-stats"], queryFn: () => fn() });
  const cards = [
    { icon: Wallet, label: "Total Penjualan", value: formatRupiah(data?.totalSales ?? 0) },
    { icon: ShoppingBag, label: "Total Pesanan", value: data?.totalOrders ?? 0 },
    { icon: TrendingUp, label: "Pesanan Baru", value: data?.newOrders ?? 0 },
    { icon: Package, label: "Diproses", value: data?.processingOrders ?? 0 },
    { icon: Package, label: "Produk Aktif", value: data?.productCount ?? 0 },
    { icon: Users, label: "Customer", value: data?.customerCount ?? 0 },
  ];
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-card p-4">
            <c.icon className="h-5 w-5 text-primary" />
            <p className="mt-2 text-xs text-muted-foreground">{c.label}</p>
            <p className="font-display text-lg font-extrabold">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 font-display font-bold">Penjualan Bulanan</h3>
          {(data?.monthlySales ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Belum ada data.</p> :
            (data?.monthlySales ?? []).map((m: any) => (
              <div key={m.month} className="mb-1 flex items-center gap-2 text-sm"><span className="w-16 text-muted-foreground">{m.month}</span><div className="h-3 rounded bg-primary" style={{ width: `${Math.min(100, (m.total / Math.max(...(data!.monthlySales.map((x: any) => x.total)))) * 100)}%` }} /><span className="text-xs">{formatRupiah(m.total)}</span></div>
            ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 font-display font-bold">Produk Terlaris</h3>
          {(data?.topProducts ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Belum ada data.</p> :
            (data?.topProducts ?? []).map((p: any) => (<div key={p.name} className="flex justify-between text-sm"><span>{p.name}</span><span className="font-semibold">{p.qty} terjual</span></div>))}
        </div>
      </div>
    </div>
  );
}

function OrdersTab() {
  const listFn = useServerFn(adminListOrders);
  const approveFn = useServerFn(adminApprovePayment);
  const rejectFn = useServerFn(adminRejectPayment);
  const shipFn = useServerFn(adminSetShipping);
  const statusFn = useServerFn(adminUpdateStatus);
  const [filter, setFilter] = useState("all");
  const { data: orders, refetch } = useQuery({ queryKey: ["admin-orders", filter], queryFn: () => listFn({ data: { status: filter } }) });

  async function act(p: Promise<any>) { try { await p; toast.success("Berhasil"); refetch(); } catch (e: any) { toast.error(e?.message ?? "Gagal"); } }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {["all", "menunggu_pembayaran", "menunggu_verifikasi", "diproses", "dikirim", "selesai", "ditolak"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full border px-3 py-1 text-xs font-medium ${filter === s ? "border-primary bg-accent" : "border-border"}`}>{s === "all" ? "Semua" : s.replace(/_/g, " ")}</button>
        ))}
      </div>
      <div className="space-y-3">
        {(orders ?? []).map((o: any) => (
          <div key={o.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><p className="font-semibold">{o.order_number}</p><p className="text-xs text-muted-foreground">{formatDate(o.created_at)} · {o.recipient_name} · {formatRupiah(o.total)}</p></div>
              <StatusBadge status={o.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{o.shipping_address}, {o.city}, {o.province} · {o.courier} · {o.payment_method}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {o.status === "menunggu_verifikasi" && <>
                <Button size="sm" onClick={() => act(approveFn({ data: { orderId: o.id } }))}>ACC Pembayaran</Button>
                <Button size="sm" variant="outline" onClick={() => { const r = prompt("Alasan penolakan?"); if (r) act(rejectFn({ data: { orderId: o.id, reason: r } })); }}>Tolak</Button>
              </>}
              {o.status === "diproses" && <Button size="sm" onClick={() => act(statusFn({ data: { orderId: o.id, status: "dikemas" } }))}>Tandai Dikemas</Button>}
              {o.status === "dikemas" && <Button size="sm" onClick={() => { const t = prompt("Nomor resi?"); if (t) act(shipFn({ data: { orderId: o.id, courier: o.courier, tracking_number: t } })); }}>Input Resi & Kirim</Button>}
              {o.status === "dikirim" && <Button size="sm" onClick={() => act(statusFn({ data: { orderId: o.id, status: "dalam_perjalanan" } }))}>Dalam Perjalanan</Button>}
              {o.status === "dalam_perjalanan" && <Button size="sm" onClick={() => act(statusFn({ data: { orderId: o.id, status: "selesai" } }))}>Selesai</Button>}
            </div>
          </div>
        ))}
        {(orders ?? []).length === 0 && <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">Tidak ada pesanan.</p>}
      </div>
    </div>
  );
}

function ProductsTab() {
  const listFn = useServerFn(adminListProducts);
  const saveFn = useServerFn(adminSaveProduct);
  const delFn = useServerFn(adminDeleteProduct);
  const catFn = useServerFn(adminListCategories);
  const { data: products, refetch } = useQuery({ queryKey: ["admin-products"], queryFn: () => listFn() });
  const { data: categories } = useQuery({ queryKey: ["admin-cats"], queryFn: () => catFn() });
  const [f, setF] = useState({ name: "", price: "", stock: "", weight: "", brand: "", category_id: "", description: "", imageUrl: "" });

  async function save() {
    if (!f.name) return toast.error("Nama wajib");
    try {
      await saveFn({ data: { slug: slugify(f.name) + "-" + Date.now().toString().slice(-4), name: f.name, price: Number(f.price || 0), stock: Number(f.stock || 0), weight: Number(f.weight || 0), brand: f.brand, category_id: f.category_id || null, description: f.description, images: f.imageUrl ? [f.imageUrl] : [], status: "active" } });
      setF({ name: "", price: "", stock: "", weight: "", brand: "", category_id: "", description: "", imageUrl: "" });
      refetch(); toast.success("Produk disimpan");
    } catch (e: any) { toast.error(e?.message ?? "Gagal"); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-2">
        {(products ?? []).map((p: any) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <div><p className="font-semibold">{p.name}</p><p className="text-xs text-muted-foreground">{formatRupiah(p.price)} · Stok {p.stock} · {p.product_categories?.name ?? "Tanpa kategori"}</p></div>
            <button onClick={async () => { await delFn({ data: { id: p.id } }); refetch(); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {(products ?? []).length === 0 && <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">Belum ada produk.</p>}
      </div>
      <div className="h-fit rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 font-display font-bold">Tambah Produk</h3>
        <div className="space-y-2">
          <Input placeholder="Nama produk" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
            <option value="">Pilih kategori</option>
            {(categories ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Harga" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
            <Input placeholder="Stok" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} />
            <Input placeholder="Berat kg" value={f.weight} onChange={(e) => setF({ ...f, weight: e.target.value })} />
          </div>
          <Input placeholder="Merek" value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} />
          <Input placeholder="URL gambar (opsional)" value={f.imageUrl} onChange={(e) => setF({ ...f, imageUrl: e.target.value })} />
          <textarea placeholder="Deskripsi" className="min-h-16 w-full rounded-md border border-input bg-background p-2 text-sm" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          <Button className="w-full" onClick={save}><Plus className="mr-1 h-4 w-4" />Simpan Produk</Button>
        </div>
      </div>
    </div>
  );
}

function CategoriesTab() {
  const listFn = useServerFn(adminListCategories);
  const saveFn = useServerFn(adminSaveCategory);
  const delFn = useServerFn(adminDeleteCategory);
  const { data: cats, refetch } = useQuery({ queryKey: ["admin-cats-tab"], queryFn: () => listFn() });
  const [name, setName] = useState("");
  return (
    <div className="max-w-lg space-y-3">
      <div className="flex gap-2">
        <Input placeholder="Nama kategori" value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={async () => { if (!name) return; await saveFn({ data: { name, slug: slugify(name) } }); setName(""); refetch(); toast.success("Kategori ditambah"); }}>Tambah</Button>
      </div>
      <div className="space-y-2">
        {(cats ?? []).map((c: any) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <span className="font-medium">{c.name}</span>
            <button onClick={async () => { await delFn({ data: { id: c.id } }); refetch(); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomersTab() {
  const fn = useServerFn(adminListCustomers);
  const { data } = useQuery({ queryKey: ["admin-customers"], queryFn: () => fn() });
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left"><tr><th className="p-3">Nama</th><th className="p-3">Email</th><th className="p-3">Transaksi</th><th className="p-3">Total Belanja</th></tr></thead>
        <tbody>
          {(data ?? []).map((c: any) => (<tr key={c.id} className="border-t border-border"><td className="p-3 font-medium">{c.fullname || "-"}</td><td className="p-3">{c.email}</td><td className="p-3">{c.order_count}</td><td className="p-3">{formatRupiah(c.total_spent)}</td></tr>))}
        </tbody>
      </table>
      {(data ?? []).length === 0 && <p className="p-8 text-center text-muted-foreground">Belum ada customer.</p>}
    </div>
  );
}

function SettingsTab() {
  const getFn = useServerFn(adminGetSettings);
  const saveFn = useServerFn(adminSaveSettings);
  const { data } = useQuery({ queryKey: ["admin-settings"], queryFn: () => getFn() });
  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (data && !form) setForm({ store_name: data.store_name, contact_phone: data.contact_phone, contact_email: data.contact_email, banks: BANKS.map((b) => data.banks?.find((x: any) => x.bank === b) ?? { bank: b, number: "", holder: "" }) }); }, [data, form]);
  if (!form) return <p className="text-muted-foreground">Memuat…</p>;
  return (
    <div className="max-w-xl space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1"><Label>Nama Toko</Label><Input value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} /></div>
        <div className="space-y-1"><Label>Telepon</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
        <div className="space-y-1"><Label>Email</Label><Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
      </div>
      <h3 className="font-display font-bold">Rekening Bank</h3>
      {form.banks.map((b: any, i: number) => (
        <div key={b.bank} className="grid grid-cols-3 gap-2">
          <Input value={b.bank} disabled />
          <Input placeholder="No. rekening" value={b.number} onChange={(e) => { const banks = [...form.banks]; banks[i] = { ...b, number: e.target.value }; setForm({ ...form, banks }); }} />
          <Input placeholder="Atas nama" value={b.holder} onChange={(e) => { const banks = [...form.banks]; banks[i] = { ...b, holder: e.target.value }; setForm({ ...form, banks }); }} />
        </div>
      ))}
      <Button onClick={async () => { await saveFn({ data: form }); toast.success("Pengaturan disimpan"); }}>Simpan Pengaturan</Button>
    </div>
  );
}