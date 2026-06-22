import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Plus, Package, Star, ShoppingCart, Truck, ShieldCheck } from "lucide-react";
import { getProductBySlug } from "@/lib/catalog.functions";
import { PublicShell } from "@/components/layout/PublicShell";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";

const detailQuery = (slug: string) =>
  queryOptions({ queryKey: ["product", slug], queryFn: () => getProductBySlug({ data: { slug } }) });

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(detailQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    return {
      meta: [
        { title: p ? `${p.name} — TukangHub` : "Produk — TukangHub" },
        { name: "description", content: p?.description?.slice(0, 155) ?? "Detail produk material bangunan di TukangHub." },
        { property: "og:title", content: p?.name ?? "Produk TukangHub" },
        { property: "og:description", content: p?.description?.slice(0, 155) ?? "" },
        ...(p?.images?.[0] ? [{ property: "og:image", content: p.images[0] }] : []),
      ],
      links: [{ rel: "canonical", href: `/products/${loaderData?.product.slug ?? ""}` }],
    };
  },
  notFoundComponent: () => (
    <PublicShell><div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-bold">Produk tidak ditemukan</h1>
      <Button asChild className="mt-4"><Link to="/products">Kembali ke katalog</Link></Button>
    </div></PublicShell>
  ),
  errorComponent: () => (
    <PublicShell><div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-bold">Gagal memuat produk</h1>
      <Button asChild className="mt-4"><Link to="/products">Kembali ke katalog</Link></Button>
    </div></PublicShell>
  ),
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(detailQuery(slug));
  const navigate = useNavigate();
  const { user } = useAuth();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  if (!data) return null;
  const { product, reviews, related } = data;
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  async function handleAdd(buyNow = false) {
    if (!user) { navigate({ to: "/auth", search: { redirect: `/products/${slug}` } as any }); return; }
    await add.mutateAsync({ productId: product.id, qty });
    if (buyNow) navigate({ to: "/cart" });
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <nav className="mb-4 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Beranda</Link> /{" "}
          <Link to="/products" className="hover:text-primary">Produk</Link> /{" "}
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="aspect-square overflow-hidden rounded-xl border border-border bg-muted">
              {product.images[activeImg] ? (
                <img src={product.images[activeImg]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground"><Package className="h-20 w-20" /></div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`h-16 w-16 overflow-hidden rounded-md border-2 ${i === activeImg ? "border-primary" : "border-border"}`}>
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {product.category_name && <span className="text-sm font-medium uppercase tracking-wide text-primary">{product.category_name}</span>}
            <h1 className="mt-1 font-display text-3xl font-extrabold">{product.name}</h1>
            {reviews.length > 0 && (
              <div className="mt-2 flex items-center gap-1 text-sm">
                <div className="flex text-warning">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < Math.round(avgRating) ? "fill-current" : ""}`} />)}</div>
                <span className="text-muted-foreground">({reviews.length} ulasan)</span>
              </div>
            )}
            <p className="mt-4 font-display text-4xl font-extrabold text-primary">{formatRupiah(product.price)}</p>

            <div className="mt-4 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Stok:</span> <span className="font-semibold">{product.stock > 0 ? product.stock : "Habis"}</span></p>
              <p><span className="text-muted-foreground">Berat:</span> <span className="font-semibold">{product.weight} kg</span></p>
              {product.brand && <p><span className="text-muted-foreground">Merek:</span> <span className="font-semibold">{product.brand}</span></p>}
              {product.sku && <p><span className="text-muted-foreground">SKU:</span> <span className="font-semibold">{product.sku}</span></p>}
            </div>

            {product.stock > 0 && (
              <div className="mt-6 flex items-center gap-3">
                <div className="flex items-center rounded-md border border-input">
                  <button className="p-2.5" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></button>
                  <span className="w-10 text-center font-semibold">{qty}</span>
                  <button className="p-2.5" onClick={() => setQty((q) => Math.min(product.stock, q + 1))}><Plus className="h-4 w-4" /></button>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <Button size="lg" variant="outline" disabled={product.stock <= 0 || add.isPending} onClick={() => handleAdd(false)}>
                <ShoppingCart className="mr-1 h-4 w-4" /> Tambah Keranjang
              </Button>
              <Button size="lg" disabled={product.stock <= 0 || add.isPending} onClick={() => handleAdd(true)}>Beli Sekarang</Button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 rounded-lg border border-border p-3"><Truck className="h-5 w-5 text-primary" /> Pengiriman cepat</div>
              <div className="flex items-center gap-2 rounded-lg border border-border p-3"><ShieldCheck className="h-5 w-5 text-primary" /> Pembayaran aman</div>
            </div>
          </div>
        </div>

        {product.description && (
          <section className="mt-12">
            <h2 className="font-display text-xl font-bold">Deskripsi Produk</h2>
            <p className="mt-3 whitespace-pre-line text-muted-foreground">{product.description}</p>
          </section>
        )}

        <section className="mt-12">
          <h2 className="font-display text-xl font-bold">Ulasan ({reviews.length})</h2>
          {reviews.length > 0 ? (
            <div className="mt-4 space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-lg border border-border p-4">
                  <div className="flex text-warning">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-current" : ""}`} />)}</div>
                  {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-muted-foreground">Belum ada ulasan untuk produk ini.</p>
          )}
        </section>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 font-display text-xl font-bold">Produk Terkait</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </PublicShell>
  );
}