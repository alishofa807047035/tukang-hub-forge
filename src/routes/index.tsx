import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ShieldCheck, Truck, BadgeCheck, Wallet, Search, ShoppingBag, PackageCheck,
  Hammer, ArrowRight, Star, Layers,
} from "lucide-react";
import { getHomeData } from "@/lib/catalog.functions";
import { PublicShell } from "@/components/layout/PublicShell";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

const homeQuery = queryOptions({
  queryKey: ["home"],
  queryFn: () => getHomeData(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TukangHub — Material Bangunan & Jasa Tukang Terpercaya" },
      { name: "description", content: "Belanja material bangunan berkualitas dan temukan jasa tukang terpercaya di TukangHub. Harga transparan, pengiriman cepat, pembayaran aman." },
      { property: "og:title", content: "TukangHub — Material Bangunan & Jasa Tukang" },
      { property: "og:description", content: "Belanja material bangunan berkualitas dan jasa tukang terpercaya dalam satu platform." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  component: Index,
});

const KEUNGGULAN = [
  { icon: BadgeCheck, title: "Produk Berkualitas", desc: "Material bangunan original dari brand terpercaya." },
  { icon: Wallet, title: "Harga Transparan", desc: "Tanpa biaya tersembunyi, harga jelas di muka." },
  { icon: Truck, title: "Pengiriman Cepat", desc: "Dukungan kurir JNE, J&T, SiCepat & AnterAja." },
  { icon: ShieldCheck, title: "Pembayaran Aman", desc: "Verifikasi pembayaran manual yang aman & terpantau." },
];

const CARA_KERJA = [
  { icon: Search, title: "Pilih Produk", desc: "Telusuri katalog material bangunan lengkap." },
  { icon: ShoppingBag, title: "Checkout", desc: "Isi alamat & pilih kurir, dapatkan nomor pesanan." },
  { icon: Wallet, title: "Bayar & Konfirmasi", desc: "Transfer bank lalu unggah bukti pembayaran." },
  { icon: PackageCheck, title: "Terima Pesanan", desc: "Lacak pesanan hingga tiba di lokasi Anda." },
];

function Index() {
  const { data } = useSuspenseQuery(homeQuery);
  return (
    <PublicShell>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-accent/40 via-background to-background">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 md:grid-cols-2 md:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Hammer className="h-3.5 w-3.5" /> Marketplace Material & Jasa Tukang
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-6xl">
              Bangun lebih mudah bersama <span className="text-primary">TukangHub</span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">
              Belanja material bangunan berkualitas dengan harga transparan dan pengiriman cepat ke seluruh Indonesia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/products">Mulai Belanja <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/tracking">Lacak Pesanan</Link></Button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="hidden md:block">
            <div className="grid grid-cols-2 gap-4">
              {KEUNGGULAN.map((k) => (
                <div key={k.title} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <k.icon className="h-8 w-8 text-primary" />
                  <h3 className="mt-3 font-display text-base font-bold">{k.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{k.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* KEUNGGULAN (mobile) */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:hidden">
        <div className="grid grid-cols-2 gap-4">
          {KEUNGGULAN.map((k) => (
            <div key={k.title} className="rounded-xl border border-border bg-card p-4">
              <k.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-2 font-display text-sm font-bold">{k.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{k.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KATEGORI */}
      {data.categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <SectionHeading title="Kategori Produk" subtitle="Temukan kebutuhan proyek Anda" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {data.categories.map((c) => (
              <Link key={c.id} to="/products" search={{ category: c.slug } as any}
                className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 text-center transition-colors hover:border-primary">
                <Layers className="h-7 w-7 text-primary" />
                <span className="text-xs font-medium">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CARA KERJA */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <SectionHeading title="Cara Kerja" subtitle="Hanya 4 langkah mudah" />
          <div className="grid gap-6 md:grid-cols-4">
            {CARA_KERJA.map((s, i) => (
              <div key={s.title} className="relative rounded-xl border border-border bg-card p-6">
                <span className="absolute right-4 top-4 font-display text-3xl font-extrabold text-primary/15">{i + 1}</span>
                <s.icon className="h-9 w-9 text-primary" />
                <h3 className="mt-3 font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUK TERLARIS */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="flex items-end justify-between">
          <SectionHeading title="Produk Terbaru" subtitle="Material pilihan untuk proyek Anda" align="left" />
          <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link to="/products">Lihat semua <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
        {data.featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
            Belum ada produk. Produk akan tampil di sini setelah ditambahkan oleh admin.
          </p>
        )}
      </section>

      {/* TESTIMONI */}
      {data.testimonials.length > 0 && (
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-14">
            <SectionHeading title="Kata Mereka" subtitle="Testimoni pelanggan TukangHub" />
            <div className="grid gap-6 md:grid-cols-3">
              {data.testimonials.map((t: any) => (
                <div key={t.id} className="rounded-xl border border-border bg-card p-6">
                  <div className="flex gap-0.5 text-warning">
                    {Array.from({ length: t.rating ?? 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">"{t.content}"</p>
                  <p className="mt-4 font-semibold">{t.name}</p>
                  {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="overflow-hidden rounded-2xl bg-primary px-8 py-12 text-center text-primary-foreground md:py-16">
          <h2 className="font-display text-3xl font-extrabold md:text-4xl">Siap memulai proyek Anda?</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Bergabunglah dengan TukangHub dan dapatkan material bangunan berkualitas dengan harga terbaik.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-6"><Link to="/products">Jelajahi Produk</Link></Button>
        </div>
      </section>
    </PublicShell>
  );
}

function SectionHeading({ title, subtitle, align = "center" }: { title: string; subtitle?: string; align?: "center" | "left" }) {
  return (
    <div className={`mb-8 ${align === "center" ? "text-center" : ""}`}>
      <h2 className="font-display text-3xl font-extrabold">{title}</h2>
      {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
