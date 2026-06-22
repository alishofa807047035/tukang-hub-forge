import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Clock } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getOrderByNumber, submitPaymentProof } from "@/lib/orders.functions";
import { getSiteSettings } from "@/lib/catalog.functions";
import { formatRupiah } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import type { BankAccount } from "@/lib/constants";

export const Route = createFileRoute("/payment/$orderNumber")({
  head: () => ({ meta: [{ title: "Instruksi Pembayaran — TukangHub" }] }),
  component: PaymentPage,
});

function PaymentPage() {
  const { orderNumber } = Route.useParams();
  const { user, loading } = useAuth();
  const orderFn = useServerFn(getOrderByNumber);
  const submitFn = useServerFn(submitPaymentProof);
  const { data, refetch } = useQuery({ queryKey: ["order", orderNumber], queryFn: () => orderFn({ data: { orderNumber } }), enabled: !!user });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: () => getSiteSettings() });
  const [sender, setSender] = useState("");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState("");

  useEffect(() => {
    if (!data?.order) return;
    const deadline = new Date(data.order.created_at).getTime() + 24 * 3600 * 1000;
    const t = setInterval(() => {
      const diff = deadline - Date.now();
      if (diff <= 0) { setLeft("Waktu habis"); return; }
      const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
      setLeft(`${h}j ${m}m ${s}d`);
    }, 1000);
    return () => clearInterval(t);
  }, [data?.order]);

  if (!loading && !user) return <PublicShell><div className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="font-display text-2xl font-bold">Masuk untuk melihat pembayaran</h1><Button asChild className="mt-4"><Link to="/auth">Masuk</Link></Button></div></PublicShell>;
  if (!data?.order) return <PublicShell><div className="mx-auto max-w-md px-4 py-24 text-center text-muted-foreground">Memuat pesanan…</div></PublicShell>;

  const order = data.order;
  const banks = (settings?.banks ?? []) as BankAccount[];
  const selectedBank = banks.find((b) => b.bank === order.payment_method) ?? banks[0];
  const needsProof = order.status === "menunggu_pembayaran";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      let proofPath = "";
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${order.id}-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("payment-proofs").upload(path, file);
        if (error) throw error;
        proofPath = path;
      }
      await submitFn({ data: { orderId: order.id, transfer_bank: order.payment_method, sender_name: sender, amount: Number(amount), proof_image: proofPath } });
      toast.success("Bukti transfer terkirim, menunggu verifikasi");
      refetch();
    } catch (e: any) { toast.error(e?.message ?? "Gagal mengunggah"); } finally { setBusy(false); }
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold">Instruksi Pembayaran</h1>
            <p className="text-muted-foreground">Pesanan <span className="font-semibold text-foreground">{order.order_number}</span></p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {needsProof && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-warning">
            <Clock className="h-5 w-5" /> <span className="text-sm font-medium">Selesaikan pembayaran dalam {left}</span>
          </div>
        )}

        <div className="mt-6 rounded-lg border border-border p-5">
          <p className="text-sm text-muted-foreground">Total yang harus dibayar</p>
          <p className="font-display text-3xl font-extrabold text-primary">{formatRupiah(order.total)}</p>
          {selectedBank && (
            <div className="mt-4 rounded-md bg-muted p-4">
              <p className="text-sm text-muted-foreground">Transfer ke {selectedBank.bank}</p>
              <div className="flex items-center gap-2"><p className="font-display text-xl font-bold">{selectedBank.number}</p>
                <button onClick={() => { navigator.clipboard.writeText(selectedBank.number); toast.success("Nomor rekening disalin"); }}><Copy className="h-4 w-4 text-muted-foreground" /></button></div>
              <p className="text-sm">a.n. {selectedBank.holder}</p>
            </div>
          )}
        </div>

        {needsProof ? (
          <form onSubmit={submit} className="mt-6 space-y-4 rounded-lg border border-border p-5">
            <h2 className="font-display text-lg font-bold">Upload Bukti Transfer</h2>
            <div className="space-y-1"><Label>Nama Pengirim</Label><Input required value={sender} onChange={(e) => setSender(e.target.value)} /></div>
            <div className="space-y-1"><Label>Nominal Transfer</Label><Input required type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div className="space-y-1"><Label>Bukti Transfer (gambar)</Label><Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
            <Button type="submit" className="w-full" disabled={busy}>Kirim Konfirmasi</Button>
          </form>
        ) : (
          <div className="mt-6 rounded-lg border border-border p-5 text-center text-muted-foreground">
            Bukti transfer sudah dikirim. <Link to="/tracking" className="text-primary underline">Lacak pesanan Anda</Link>.
          </div>
        )}
      </div>
    </PublicShell>
  );
}