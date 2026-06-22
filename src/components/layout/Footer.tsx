import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-sidebar text-sidebar-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-display text-lg font-extrabold text-primary-foreground">T</span>
            <span className="font-display text-xl font-extrabold">Tukang<span className="text-primary">Hub</span></span>
          </div>
          <p className="text-sm text-sidebar-foreground/70">
            Marketplace material bangunan dan jasa tukang terpercaya. Cepat, transparan, dan berkualitas.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-wide">Belanja</h4>
          <ul className="space-y-2 text-sm text-sidebar-foreground/70">
            <li><Link to="/products" className="hover:text-primary">Semua Produk</Link></li>
            <li><Link to="/cart" className="hover:text-primary">Keranjang</Link></li>
            <li><Link to="/tracking" className="hover:text-primary">Lacak Pesanan</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-wide">Akun</h4>
          <ul className="space-y-2 text-sm text-sidebar-foreground/70">
            <li><Link to="/auth" className="hover:text-primary">Masuk / Daftar</Link></li>
            <li><Link to="/account" className="hover:text-primary">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-wide">Bantuan</h4>
          <p className="text-sm text-sidebar-foreground/70">Hubungi kami untuk pertanyaan seputar produk dan pesanan Anda.</p>
        </div>
      </div>
      <div className="border-t border-sidebar-border py-4 text-center text-xs text-sidebar-foreground/60">
        © {new Date().getFullYear()} TukangHub. Seluruh hak cipta dilindungi.
      </div>
    </footer>
  );
}