import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PublicShell } from "@/components/layout/PublicShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { getOrderByNumber } from "@/lib/orders.functions";
import { OrderTimeline } from "@/components/OrderTimeline";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRupiah } from "@/lib/format";

export const Route = createFileRoute("/tracking")({
  head: () => ({ meta: [{ title: "Lacak Pesanan — TukangHub" }, { name: "description", content: "Lacak status pesanan Anda di TukangHub." }] }),
  component: TrackingPage,
});

function TrackingPage() {
  const { user } = useAuth();
  const orderFn = useServerFn(getOrderByNumber);
  const [num, setNum] = useState("");
  const [data, setData] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const res = await orderFn({ data: { orderNumber: num.trim() } });
    setData(res); setSearched(true);
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="font-display text-3xl font-extrabold">Lacak Pesanan</h1>
        {!user ? (
          <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground">Masuk untuk melacak pesanan Anda.</p>
            <Button asChild className="mt-4"><Link to="/auth" search={{ redirect: "/tracking" } as any}>Masuk</Link></Button>
          </div>
        ) : (
          <>
            <form onSubmit={search} className="mt-6 flex gap-2">
              <Input placeholder="Masukkan nomor pesanan (TH-...)" value={num} onChange={(e) => setNum(e.target.value)} />
              <Button type="submit">Lacak</Button>
            </form>
            {searched && !data?.order && <p className="mt-6 text-muted-foreground">Pesanan tidak ditemukan.</p>}
            {data?.order && (
              <div className="mt-6 space-y-6">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div><p className="font-semibold">{data.order.order_number}</p><p className="text-sm text-muted-foreground">{formatRupiah(data.order.total)}</p></div>
                  <StatusBadge status={data.order.status} />
                </div>
                {data.order.tracking_number && <p className="text-sm">Resi: <span className="font-semibold">{data.order.tracking_number}</span> ({data.order.courier})</p>}
                <div className="rounded-lg border border-border p-5"><OrderTimeline status={data.order.status} history={data.history} /></div>
              </div>
            )}
          </>
        )}
      </div>
    </PublicShell>
  );
}