import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Hammer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" ? s.redirect : undefined }),
  head: () => ({ meta: [{ title: "Masuk / Daftar — TukangHub" }, { name: "description", content: "Masuk atau buat akun TukangHub." }] }),
  component: AuthPage,
});

const loginSchema = z.object({ email: z.string().email("Email tidak valid"), password: z.string().min(6, "Minimal 6 karakter") });
const registerSchema = z.object({
  fullname: z.string().min(2, "Nama minimal 2 karakter"),
  phone: z.string().min(6, "Nomor HP tidak valid"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Minimal 6 karakter"),
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState("login");
  const [forgot, setForgot] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: redirect ?? "/account" });
  }, [user, redirect, navigate]);

  const login = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const register = useForm<z.infer<typeof registerSchema>>({ resolver: zodResolver(registerSchema), defaultValues: { fullname: "", phone: "", email: "", password: "" } });
  const [forgotEmail, setForgotEmail] = useState("");

  async function onLogin(v: z.infer<typeof loginSchema>) {
    const { error } = await supabase.auth.signInWithPassword(v);
    if (error) return toast.error(error.message);
    toast.success("Berhasil masuk");
    navigate({ to: redirect ?? "/account" });
  }
  async function onRegister(v: z.infer<typeof registerSchema>) {
    const { error } = await supabase.auth.signUp({
      email: v.email, password: v.password,
      options: { emailRedirectTo: window.location.origin, data: { fullname: v.fullname, phone: v.phone } },
    });
    if (error) return toast.error(error.message);
    toast.success("Akun berhasil dibuat");
    navigate({ to: redirect ?? "/account" });
  }
  async function onGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) return toast.error("Gagal masuk dengan Google");
    if (result.redirected) return;
    navigate({ to: redirect ?? "/account" });
  }
  async function onForgot(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) return toast.error(error.message);
    toast.success("Tautan reset password telah dikirim ke email Anda");
    setForgot(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-accent/30 to-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <a href="/" className="inline-flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary font-display text-lg font-extrabold text-primary-foreground">T</span>
            <span className="font-display text-2xl font-extrabold">Tukang<span className="text-primary">Hub</span></span>
          </a>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {forgot ? (
            <form onSubmit={onForgot} className="space-y-4">
              <h1 className="font-display text-xl font-bold">Lupa Password</h1>
              <p className="text-sm text-muted-foreground">Masukkan email Anda, kami akan mengirim tautan reset.</p>
              <div className="space-y-1"><Label>Email</Label><Input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} /></div>
              <Button type="submit" className="w-full">Kirim Tautan Reset</Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setForgot(false)}>Kembali</Button>
            </form>
          ) : (
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Masuk</TabsTrigger>
                <TabsTrigger value="register">Daftar</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={login.handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-1"><Label>Email</Label><Input type="email" {...login.register("email")} />{login.formState.errors.email && <p className="text-xs text-destructive">{login.formState.errors.email.message}</p>}</div>
                  <div className="space-y-1"><Label>Password</Label><Input type="password" {...login.register("password")} />{login.formState.errors.password && <p className="text-xs text-destructive">{login.formState.errors.password.message}</p>}</div>
                  <button type="button" className="text-xs text-primary hover:underline" onClick={() => setForgot(true)}>Lupa password?</button>
                  <Button type="submit" className="w-full" disabled={login.formState.isSubmitting}>Masuk</Button>
                </form>
              </TabsContent>
              <TabsContent value="register">
                <form onSubmit={register.handleSubmit(onRegister)} className="space-y-4">
                  <div className="space-y-1"><Label>Nama Lengkap</Label><Input {...register.register("fullname")} />{register.formState.errors.fullname && <p className="text-xs text-destructive">{register.formState.errors.fullname.message}</p>}</div>
                  <div className="space-y-1"><Label>Nomor HP</Label><Input {...register.register("phone")} />{register.formState.errors.phone && <p className="text-xs text-destructive">{register.formState.errors.phone.message}</p>}</div>
                  <div className="space-y-1"><Label>Email</Label><Input type="email" {...register.register("email")} />{register.formState.errors.email && <p className="text-xs text-destructive">{register.formState.errors.email.message}</p>}</div>
                  <div className="space-y-1"><Label>Password</Label><Input type="password" {...register.register("password")} />{register.formState.errors.password && <p className="text-xs text-destructive">{register.formState.errors.password.message}</p>}</div>
                  <Button type="submit" className="w-full" disabled={register.formState.isSubmitting}>Daftar</Button>
                </form>
              </TabsContent>
            </Tabs>
          )}

          {!forgot && (
            <>
              <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />ATAU<div className="h-px flex-1 bg-border" /></div>
              <Button variant="outline" className="w-full" onClick={onGoogle}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/></svg>
                Lanjutkan dengan Google
              </Button>
            </>
          )}
        </div>
        <p className="mt-4 flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
          <Hammer className="h-3 w-3" /> Marketplace material bangunan terpercaya
        </p>
      </div>
    </div>
  );
}