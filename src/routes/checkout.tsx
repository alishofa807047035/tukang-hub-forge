import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PublicShell } from "@/components/layout/PublicShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { formatRupiah } from "@/lib/format";
import { COURIERS, BANKS, SHIPPING_COST } from "@/lib/constants";
import { checkout } from "@/lib/orders.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — TukangHub" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { user, profile, loading } = useAuth();
  const { items, subtotal } = useCart();
  const navigate = useNavigate();
  const checkoutFn = useServerFn(checkout);
  const [submitting, setSubmitting] = useState(false);
  const [courier, setCourier] = useState<string>(COURIERS[0]);
  const [bank, setBank] = useState<string>(BANKS[0]);
  const [form, setForm] = useState({
    recipient_name: profile?.fullname ?? "", recipient_phone: profile?.phone ?? "",
    province: "", city: "", district: "", village: "", postal_code: "", full_address: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const shipping = (SHIPPING_COST as Record<string, number>)[courier] ?? 20000;
  const total = subtotal + shipping;

  if (!loading && !user)
    return <PublicShell><div className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="font-display text-2xl font-bold">Masuk untuk checkout</h1><Button asChild className="mt-4"><Link to="/auth" search={{ redirect: "/checkout" } as any}>Masuk</Link></Button></div></PublicShell>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return toast.error("Keranjang kosong");
    setSubmitting(true);
    try {
      const res = await checkoutFn({ data: { ...form, courier, payment_method: bank, save_address: true } });
      toast.success("Pesanan berhasil dibuat");
      navigate({ to: "/payment/$orderNumber", params: { orderNumber: res.orderNumber } });
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal membuat pesanan");
    } finally { setSubmitting(false); }
  }

  return (
    <PublicShell>
      <form onSubmit={submit} className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="font-display text-3xl font-extrabold">Checkout</h1>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <section className="rounded-lg border border-border p-5">
              <h2 className="mb-4 font-display text-lg font-bold">Data Penerima</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1"><Label>Nama Penerima</Label><Input required value={form.recipient_name} onChange={(e) => set("recipient_name", e.target.value)} /></div>
                <div className="space-y-1"><Label>Nomor HP</Label><Input required value={form.recipient_phone} onChange={(e) => set("recipient_phone", e.target.value)} /></div>
              </div>
            </section>
            <section className="rounded-lg border border-border p-5">
              <h2 className="mb-4 font-display text-lg font-bold">Alamat Pengiriman</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1"><Label>Provinsi</Label><Input required value={form.province} onChange={(e) => set("province", e.target.value)} /></div>
                <div className="space-y-1"><Label>Kota/Kabupaten</Label><Input required value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
                <div className="space-y-1"><Label>Kecamatan</Label><Input value={form.district} onChange={(e) => set("district", e.target.value)} /></div>
                <div className="space-y-1"><Label>Kelurahan</Label><Input value={form.village} onChange={(e) => set("village", e.target.value)} /></div>
                <div className="space-y-1"><Label>Kode Pos</Label><Input value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} /></div>
              </div>
              <div className="mt-4 space-y-1"><Label>Detail Alamat</Label><textarea required value={form.full_address} onChange={(e) => set("full_address", e.target.value)} className="min-h-20 w-full rounded-md border border-input bg-background p-2 text-sm" /></div>
            </section>
            <section className="rounded-lg border border-border p-5">
              <h2 className="mb-4 font-display text-lg font-bold">Pengiriman</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {COURIERS.map((c) => (
                  <button type="button" key={c} onClick={() => setCourier(c)} className={`rounded-md border p-3 text-sm font-medium ${courier === c ? "border-primary bg-accent" : "border-border"}`}>{c}<div className="text-xs text-muted-foreground">{formatRupiah(SHIPPING_COST[c])}</div></button>
                ))}
              </div>
            </section>
            <section className="rounded-lg border border-border p-5">
              <h2 className="mb-4 font-display text-lg font-bold">Pembayaran (Transfer Bank)</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {BANKS.map((b) => (
                  <button type="button" key={b} onClick={() => setBank(b)} className={`rounded-md border p-3 text-sm font-medium ${bank === b ? "border-primary bg-accent" : "border-border"}`}>{b}</button>
                ))}
              </div>
            </section>
          </div>
          <aside className="h-fit rounded-lg border border-border bg-card p-6">
            <h2 className="font-display text-lg font-bold">Ringkasan Pesanan</h2>
            <div className="mt-4 space-y-2 text-sm">
              {items.map((i) => <div key={i.id} className="flex justify-between"><span className="text-muted-foreground">{i.name} × {i.qty}</span><span>{formatRupiah(i.price * i.qty)}</span></div>)}
              <div className="my-2 border-t border-border" />
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ongkir ({courier})</span><span>{formatRupiah(shipping)}</span></div>
              <div className="my-2 border-t border-border" />
              <div className="flex justify-between text-base font-bold"><span>Total</span><span className="text-primary">{formatRupiah(total)}</span></div>
            </div>
            <Button type="submit" className="mt-6 w-full" size="lg" disabled={submitting || items.length === 0}>Buat Pesanan</Button>
          </aside>
        </div>
      </form>
    </PublicShell>
  );
}