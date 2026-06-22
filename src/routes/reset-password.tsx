import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Atur Ulang Password — TukangHub" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password minimal 6 karakter");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password berhasil diubah");
    navigate({ to: "/account" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-accent/30 to-background px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6">
        <h1 className="font-display text-xl font-bold">Atur Ulang Password</h1>
        <p className="text-sm text-muted-foreground">Masukkan password baru untuk akun Anda.</p>
        <div className="space-y-1"><Label>Password Baru</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button type="submit" className="w-full" disabled={loading}>Simpan Password</Button>
      </form>
    </div>
  );
}