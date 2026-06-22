import { Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type { ProductDTO } from "@/lib/catalog.functions";

export function ProductCard({ product }: { product: ProductDTO }) {
  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="aspect-square overflow-hidden bg-muted">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Package className="h-12 w-12" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.category_name && (
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {product.category_name}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{product.name}</h3>
        <div className="mt-auto pt-2">
          <p className="text-base font-bold text-primary">{formatRupiah(product.price)}</p>
          <p className="text-xs text-muted-foreground">
            {product.stock > 0 ? `Stok ${product.stock}` : "Stok habis"}
          </p>
        </div>
      </div>
    </Link>
  );
}