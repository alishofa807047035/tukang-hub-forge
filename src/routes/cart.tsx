import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingCart, Package } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { formatRupiah } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Keranjang — TukangHub" }, { name: "description", content: "Keranjang belanja Anda di TukangHub." }] }),
  component: CartPage,
});

function CartPage() {
  const { user, loading } = useAuth();
  const { items, subtotal, isLoading, update, remove, clear } = useCart();
  const navigate = useNavigate();

  if (!loading && !user) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold">Masuk untuk melihat keranjang</h1>
          <p className="mt-2 text-muted-foreground">Silakan masuk atau daftar untuk mulai berbelanja.</p>
          <Button asChild className="mt-6"><Link to="/auth" search={{ redirect: "/cart" } as any}>Masuk / Daftar</Link></Button>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="font-display text-3xl font-extrabold">Keranjang Belanja</h1>
        {isLoading ? (
          <p className="mt-8 text-muted-foreground">Memuat…</p>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-border p-16 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Keranjang Anda kosong.</p>
            <Button asChild className="mt-4"><Link to="/products">Mulai Belanja</Link></Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-lg border border-border bg-card p-4">
                  <Link to="/products/$slug" params={{ slug: item.slug }} className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><Package className="h-8 w-8 text-muted-foreground" /></div>}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <Link to="/products/$slug" params={{ slug: item.slug }} className="font-semibold hover:text-primary">{item.name}</Link>
                    <p className="text-primary font-bold">{formatRupiah(item.price)}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-md border border-input">
                        <button className="p-2" onClick={() => update.mutate({ itemId: item.id, qty: Math.max(1, item.qty - 1) })}><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                        <button className="p-2" onClick={() => update.mutate({ itemId: item.id, qty: Math.min(item.stock, item.qty + 1) })}><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <button className="text-muted-foreground hover:text-destructive" onClick={() => remove.mutate({ itemId: item.id })}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="text-right font-bold">{formatRupiah(item.price * item.qty)}</div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => clear.mutate()}>
                <Trash2 className="mr-1 h-4 w-4" /> Kosongkan keranjang
              </Button>
            </div>

            <aside className="h-fit rounded-lg border border-border bg-card p-6">
              <h2 className="font-display text-lg font-bold">Ringkasan</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold">{formatRupiah(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Estimasi ongkir</span><span className="font-semibold">Dihitung saat checkout</span></div>
                <div className="my-3 border-t border-border" />
                <div className="flex justify-between text-base"><span className="font-bold">Total</span><span className="font-bold text-primary">{formatRupiah(subtotal)}</span></div>
              </div>
              <Button className="mt-6 w-full" size="lg" onClick={() => navigate({ to: "/checkout" })}>Lanjut ke Checkout</Button>
            </aside>
          </div>
        )}
      </div>
    </PublicShell>
  );
}