import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Package, MapPin, User as UserIcon, KeyRound, LayoutDashboard, Plus, Trash2 } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getCustomerStats } from "@/lib/orders.functions";
import { getAddresses, saveAddress, deleteAddress, updateProfile } from "@/lib/account.functions";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Dashboard — TukangHub" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, profile, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const statsFn = useServerFn(getCustomerStats);
  const addrFn = useServerFn(getAddresses);
  const saveAddrFn = useServerFn(saveAddress);
  const delAddrFn = useServerFn(deleteAddress);
  const updProfileFn = useServerFn(updateProfile);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/account" } as any }); }, [loading, user, navigate]);

  const { data: stats } = useQuery({ queryKey: ["cust-stats"], queryFn: () => statsFn(), enabled: !!user });
  const { data: addresses, refetch: refetchAddr } = useQuery({ queryKey: ["addresses"], queryFn: () => addrFn(), enabled: !!user });

  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [pwd, setPwd] = useState("");
  const [newAddr, setNewAddr] = useState({ recipient_name: "", phone: "", province: "", city: "", district: "", village: "", postal_code: "", full_address: "" });
  useEffect(() => { if (profile) { setFullname(profile.fullname); setPhone(profile.phone ?? ""); } }, [profile]);

  if (!user) return null;

  async function saveProfile() { await updProfileFn({ data: { fullname, phone } }); await refresh(); toast.success("Profil diperbarui"); }
  async function changePwd() { if (pwd.length < 6) return toast.error("Min 6 karakter"); const { error } = await supabase.auth.updateUser({ password: pwd }); if (error) return toast.error(error.message); setPwd(""); toast.success("Password diubah"); }
  async function addAddress() { await saveAddrFn({ data: { ...newAddr, is_default: false } }); setNewAddr({ recipient_name: "", phone: "", province: "", city: "", district: "", village: "", postal_code: "", full_address: "" }); refetchAddr(); toast.success("Alamat disimpan"); }

  return (
    <PublicShell>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="font-display text-3xl font-extrabold">Halo, {profile?.fullname || "Pelanggan"}</h1>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={LayoutDashboard} label="Total Pesanan" value={stats?.total ?? 0} />
          <StatCard icon={Package} label="Pesanan Aktif" value={stats?.active ?? 0} />
          <StatCard icon={Package} label="Pesanan Selesai" value={stats?.done ?? 0} />
        </div>

        <Tabs defaultValue="orders" className="mt-8">
          <TabsList>
            <TabsTrigger value="orders"><Package className="mr-1 h-4 w-4" />Pesanan</TabsTrigger>
            <TabsTrigger value="address"><MapPin className="mr-1 h-4 w-4" />Alamat</TabsTrigger>
            <TabsTrigger value="profile"><UserIcon className="mr-1 h-4 w-4" />Profil</TabsTrigger>
            <TabsTrigger value="password"><KeyRound className="mr-1 h-4 w-4" />Password</TabsTrigger>
          </TabsList>
          <TabsContent value="orders" className="mt-4">
            <Button asChild><Link to="/account/orders">Lihat Semua Pesanan</Link></Button>
          </TabsContent>
          <TabsContent value="address" className="mt-4 space-y-4">
            <div className="space-y-2">
              {(addresses ?? []).map((a: any) => (
                <div key={a.id} className="flex items-start justify-between rounded-lg border border-border p-4">
                  <div><p className="font-semibold">{a.recipient_name} — {a.phone}</p><p className="text-sm text-muted-foreground">{a.full_address}, {a.village}, {a.district}, {a.city}, {a.province} {a.postal_code}</p></div>
                  <button onClick={async () => { await delAddrFn({ data: { id: a.id } }); refetchAddr(); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-dashed border-border p-4">
              <h3 className="mb-3 font-semibold">Tambah Alamat</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Nama penerima" value={newAddr.recipient_name} onChange={(e) => setNewAddr({ ...newAddr, recipient_name: e.target.value })} />
                <Input placeholder="Nomor HP" value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} />
                <Input placeholder="Provinsi" value={newAddr.province} onChange={(e) => setNewAddr({ ...newAddr, province: e.target.value })} />
                <Input placeholder="Kota" value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} />
                <Input placeholder="Kecamatan" value={newAddr.district} onChange={(e) => setNewAddr({ ...newAddr, district: e.target.value })} />
                <Input placeholder="Kelurahan" value={newAddr.village} onChange={(e) => setNewAddr({ ...newAddr, village: e.target.value })} />
                <Input placeholder="Kode Pos" value={newAddr.postal_code} onChange={(e) => setNewAddr({ ...newAddr, postal_code: e.target.value })} />
                <Input placeholder="Detail alamat" value={newAddr.full_address} onChange={(e) => setNewAddr({ ...newAddr, full_address: e.target.value })} />
              </div>
              <Button className="mt-3" onClick={addAddress}><Plus className="mr-1 h-4 w-4" />Simpan Alamat</Button>
            </div>
          </TabsContent>
          <TabsContent value="profile" className="mt-4 max-w-md space-y-3">
            <div className="space-y-1"><Label>Nama Lengkap</Label><Input value={fullname} onChange={(e) => setFullname(e.target.value)} /></div>
            <div className="space-y-1"><Label>Nomor HP</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div className="space-y-1"><Label>Email</Label><Input value={user.email ?? ""} disabled /></div>
            <Button onClick={saveProfile}>Simpan Profil</Button>
          </TabsContent>
          <TabsContent value="password" className="mt-4 max-w-md space-y-3">
            <div className="space-y-1"><Label>Password Baru</Label><Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} /></div>
            <Button onClick={changePwd}>Ubah Password</Button>
          </TabsContent>
        </Tabs>
      </div>
    </PublicShell>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <Icon className="h-6 w-6 text-primary" />
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
      <p className="font-display text-3xl font-extrabold">{value}</p>
    </div>
  );
}