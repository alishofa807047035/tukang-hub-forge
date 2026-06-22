import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PublicShell } from "@/components/layout/PublicShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/hooks/use-auth";
import { getMyOrders } from "@/lib/orders.functions";
import { formatRupiah, formatDate } from "@/lib/format";

export const Route = createFileRoute("/account/orders")({
  head: () => ({ meta: [{ title: "Pesanan Saya — TukangHub" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fn = useServerFn(getMyOrders);
  useEffect(() => { if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/account/orders" } as any }); }, [loading, user, navigate]);
  const { data: orders } = useQuery({ queryKey: ["my-orders"], queryFn: () => fn(), enabled: !!user });

  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="font-display text-3xl font-extrabold">Pesanan Saya</h1>
        <div className="mt-6 space-y-3">
          {(orders ?? []).length === 0 && <p className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">Belum ada pesanan.</p>}
          {(orders ?? []).map((o: any) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
              <div>
                <p className="font-semibold">{o.order_number}</p>
                <p className="text-sm text-muted-foreground">{formatDate(o.created_at)} · {formatRupiah(o.total)} · {o.courier}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={o.status} />
                {o.status === "menunggu_pembayaran"
                  ? <Button asChild size="sm"><Link to="/payment/$orderNumber" params={{ orderNumber: o.order_number }}>Bayar</Link></Button>
                  : <Button asChild size="sm" variant="outline"><Link to="/tracking">Lacak</Link></Button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}