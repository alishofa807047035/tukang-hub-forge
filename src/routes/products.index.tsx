import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { listProducts, listCategories } from "@/lib/catalog.functions";
import { PublicShell } from "@/components/layout/PublicShell";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface ProductSearch {
  q?: string;
  category?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "name_asc";
  min?: number;
  max?: number;
  page?: number;
}

export const Route = createFileRoute("/products/")({
  validateSearch: (s: Record<string, unknown>): ProductSearch => ({
    q: typeof s.q === "string" ? s.q : undefined,
    category: typeof s.category === "string" ? s.category : undefined,
    sort: ["newest", "price_asc", "price_desc", "name_asc"].includes(s.sort as string) ? (s.sort as any) : undefined,
    min: s.min ? Number(s.min) : undefined,
    max: s.max ? Number(s.max) : undefined,
    page: s.page ? Number(s.page) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Katalog Produk — TukangHub" },
      { name: "description", content: "Jelajahi katalog material bangunan TukangHub: semen, cat, pipa, besi, dan banyak lagi dengan harga terbaik." },
      { property: "og:title", content: "Katalog Produk — TukangHub" },
      { property: "og:description", content: "Material bangunan berkualitas dengan harga transparan." },
    ],
    links: [{ rel: "canonical", href: "/products" }],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/products" });
  const [minPrice, setMinPrice] = useState(search.min?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(search.max?.toString() ?? "");

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const page = search.page ?? 1;
  const { data, isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: () => listProducts({ data: {
      search: search.q, category: search.category, sort: search.sort ?? "newest",
      minPrice: search.min, maxPrice: search.max, page, pageSize: 12,
    } }),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  function setParam(patch: Partial<ProductSearch>) {
    navigate({ search: (prev: ProductSearch) => ({ ...prev, ...patch, page: patch.page ?? 1 }) });
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="font-display text-3xl font-extrabold">Katalog Produk</h1>
        <p className="mt-1 text-muted-foreground">
          {data ? `${data.total} produk ditemukan` : "Memuat…"}
          {search.q && ` untuk "${search.q}"`}
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Sidebar filters */}
          <aside className="space-y-6">
            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold">
                <SlidersHorizontal className="h-4 w-4" /> Kategori
              </h3>
              <div className="space-y-1">
                <button onClick={() => setParam({ category: undefined })}
                  className={`block w-full rounded px-2 py-1.5 text-left text-sm ${!search.category ? "bg-accent text-accent-foreground font-semibold" : "hover:bg-muted"}`}>
                  Semua Kategori
                </button>
                {(categories ?? []).map((c) => (
                  <button key={c.id} onClick={() => setParam({ category: c.slug })}
                    className={`block w-full rounded px-2 py-1.5 text-left text-sm ${search.category === c.slug ? "bg-accent text-accent-foreground font-semibold" : "hover:bg-muted"}`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-3 font-display text-sm font-bold">Rentang Harga</h3>
              <div className="flex items-center gap-2">
                <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min" inputMode="numeric"
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" />
                <span className="text-muted-foreground">—</span>
                <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max" inputMode="numeric"
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" />
              </div>
              <Button size="sm" className="mt-3 w-full" onClick={() => setParam({ min: minPrice ? Number(minPrice) : undefined, max: maxPrice ? Number(maxPrice) : undefined })}>
                Terapkan
              </Button>
            </div>
          </aside>

          {/* Results */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <Select value={search.sort ?? "newest"} onValueChange={(v) => setParam({ sort: v as any })}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Terbaru</SelectItem>
                  <SelectItem value="price_asc">Harga Terendah</SelectItem>
                  <SelectItem value="price_desc">Harga Tertinggi</SelectItem>
                  <SelectItem value="name_asc">Nama A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-muted" />)}
              </div>
            ) : data && data.items.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {data.items.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setParam({ page: page - 1 })}>Sebelumnya</Button>
                    <span className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setParam({ page: page + 1 })}>Berikutnya</Button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-16 text-center">
                <p className="text-muted-foreground">Tidak ada produk yang cocok dengan filter Anda.</p>
                <Button asChild variant="link" className="mt-2"><Link to="/products">Reset filter</Link></Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicShell>
  );
}