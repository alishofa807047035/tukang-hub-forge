import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, User, Menu, Search, LogOut, LayoutDashboard, Package, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/products", search: { q: search || undefined } as any });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-display text-lg font-extrabold text-primary-foreground">
            T
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">
            Tukang<span className="text-primary">Hub</span>
          </span>
        </Link>

        <form onSubmit={submitSearch} className="relative hidden flex-1 md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari material bangunan…"
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </form>

        <nav className="hidden items-center gap-1 lg:flex">
          <Link to="/products" className="px-3 py-2 text-sm font-medium hover:text-primary" activeProps={{ className: "text-primary" }}>
            Produk
          </Link>
          <Link to="/tracking" className="px-3 py-2 text-sm font-medium hover:text-primary" activeProps={{ className: "text-primary" }}>
            Lacak Pesanan
          </Link>
        </nav>

        <Link to="/cart" className="relative p-2" aria-label="Keranjang">
          <ShoppingCart className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {count}
            </span>
          )}
        </Link>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Akun">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-2 py-1.5 text-sm font-medium truncate">{profile?.fullname || user.email}</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/account"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/account/orders"><Package className="mr-2 h-4 w-4" />Pesanan Saya</Link></DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild><Link to="/admin"><LayoutDashboard className="mr-2 h-4 w-4" />Admin Panel</Link></DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { signOut(); navigate({ to: "/" }); }}>
                <LogOut className="mr-2 h-4 w-4" />Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild className="hidden sm:inline-flex"><Link to="/auth">Masuk</Link></Button>
        )}

        <button className="p-2 lg:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border lg:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            <form onSubmit={submitSearch} className="relative mb-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk…"
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
              />
            </form>
            <Link to="/products" className="block py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>Produk</Link>
            <Link to="/tracking" className="block py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>Lacak Pesanan</Link>
            {!user && <Link to="/auth" className="block py-2 text-sm font-medium text-primary" onClick={() => setMobileOpen(false)}>Masuk / Daftar</Link>}
          </div>
        </div>
      )}
    </header>
  );
}