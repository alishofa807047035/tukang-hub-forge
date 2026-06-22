import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

/* ----------------------------- DASHBOARD ----------------------------- */
export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: orders }, { count: productCount }, { count: customerCount }] = await Promise.all([
      supabaseAdmin.from("orders").select("total, status, created_at"),
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    ]);
    const rows = orders ?? [];
    const paidStatuses = ["diproses", "dikemas", "dikirim", "dalam_perjalanan", "selesai"];
    const totalSales = rows.filter((r) => paidStatuses.includes(r.status)).reduce((s, r) => s + Number(r.total), 0);
    const monthly: Record<string, number> = {};
    for (const r of rows) {
      if (!paidStatuses.includes(r.status)) continue;
      const key = new Date(r.created_at).toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
      monthly[key] = (monthly[key] ?? 0) + Number(r.total);
    }
    const monthlySales = Object.entries(monthly).map(([month, total]) => ({ month, total }));

    const { data: orderItems } = await supabaseAdmin.from("order_items").select("product_name, qty");
    const prodMap: Record<string, number> = {};
    for (const it of orderItems ?? []) prodMap[it.product_name] = (prodMap[it.product_name] ?? 0) + it.qty;
    const topProducts = Object.entries(prodMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      totalSales,
      totalOrders: rows.length,
      newOrders: rows.filter((r) => ["menunggu_pembayaran", "menunggu_verifikasi"].includes(r.status)).length,
      processingOrders: rows.filter((r) => ["diproses", "dikemas", "dikirim", "dalam_perjalanan"].includes(r.status)).length,
      productCount: productCount ?? 0,
      customerCount: customerCount ?? 0,
      monthlySales,
      topProducts,
    };
  });

/* ----------------------------- PRODUCTS ----------------------------- */
export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("products")
      .select("*, product_categories(name)")
      .order("created_at", { ascending: false });
    return data ?? [];
  });

const productSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().max(60).optional().default(""),
  slug: z.string().min(1).max(160),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().default(""),
  category_id: z.string().uuid().nullable().optional(),
  brand: z.string().max(120).optional().default(""),
  price: z.number().min(0),
  stock: z.number().int().min(0),
  weight: z.number().min(0),
  images: z.array(z.string()).optional().default([]),
  status: z.enum(["active", "inactive"]).optional().default("active"),
});

export const adminSaveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => productSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      sku: data.sku || null, slug: data.slug, name: data.name,
      description: data.description || null, category_id: data.category_id || null,
      brand: data.brand || null, price: data.price, stock: data.stock,
      weight: data.weight, images: data.images, status: data.status,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("products").update(payload).eq("id", data.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin.from("products").insert(payload);
      if (error) throw error;
    }
    return { ok: true };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("products").delete().eq("id", data.id);
    return { ok: true };
  });

/* ----------------------------- CATEGORIES ----------------------------- */
export const adminListCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("product_categories").select("*").order("name");
    return data ?? [];
  });

export const adminSaveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().min(1).max(120),
      slug: z.string().min(1).max(160),
      icon: z.string().max(60).optional().default(""),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = { name: data.name, slug: data.slug, icon: data.icon || null };
    if (data.id) await supabaseAdmin.from("product_categories").update(payload).eq("id", data.id);
    else await supabaseAdmin.from("product_categories").insert(payload);
    return { ok: true };
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("product_categories").delete().eq("id", data.id);
    return { ok: true };
  });

/* ----------------------------- ORDERS ----------------------------- */
export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ status: z.string().optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false });
    if (data.status && data.status !== "all") q = q.eq("status", data.status as any);
    const { data: rows } = await q;
    return rows ?? [];
  });

export const adminGetOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin.from("orders").select("*").eq("id", data.id).maybeSingle();
    if (!order) return null;
    const [{ data: items }, { data: payment }, { data: history }, { data: profile }] = await Promise.all([
      supabaseAdmin.from("order_items").select("*").eq("order_id", order.id),
      supabaseAdmin.from("payment_confirmations").select("*").eq("order_id", order.id).order("uploaded_at", { ascending: false }).maybeSingle(),
      supabaseAdmin.from("order_status_history").select("*").eq("order_id", order.id).order("created_at", { ascending: true }),
      supabaseAdmin.from("profiles").select("fullname, email, phone").eq("id", order.user_id).maybeSingle(),
    ]);
    let proofUrl: string | null = null;
    if (payment?.proof_image) {
      if (/^https?:\/\//.test(payment.proof_image)) proofUrl = payment.proof_image;
      else {
        const { data: signed } = await supabaseAdmin.storage
          .from("payment-proofs").createSignedUrl(payment.proof_image, 60 * 60);
        proofUrl = signed?.signedUrl ?? null;
      }
    }
    return { order, items: items ?? [], payment, history: history ?? [], profile, proofUrl };
  });

async function pushStatus(supabaseAdmin: any, orderId: string, userId: string, status: string, notes: string, notifTitle: string, notifBody: string) {
  await supabaseAdmin.from("orders").update({ status }).eq("id", orderId);
  await supabaseAdmin.from("order_status_history").insert({ order_id: orderId, status, notes });
  await supabaseAdmin.from("notifications").insert({ user_id: userId, title: notifTitle, body: notifBody });
}

export const adminApprovePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin.from("orders").select("user_id, order_number").eq("id", data.orderId).single();
    await supabaseAdmin.from("payment_confirmations").update({ status: "approved" }).eq("order_id", data.orderId);
    await pushStatus(supabaseAdmin, data.orderId, order.user_id, "diproses", "Pembayaran disetujui",
      "Pembayaran disetujui", `Pembayaran untuk ${order.order_number} telah disetujui dan pesanan diproses.`);
    return { ok: true };
  });

export const adminRejectPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid(), reason: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin.from("orders").select("user_id, order_number").eq("id", data.orderId).single();
    await supabaseAdmin.from("payment_confirmations").update({ status: "rejected" }).eq("order_id", data.orderId);
    await supabaseAdmin.from("orders").update({ reject_reason: data.reason }).eq("id", data.orderId);
    await pushStatus(supabaseAdmin, data.orderId, order.user_id, "ditolak", data.reason,
      "Pembayaran ditolak", `Pembayaran untuk ${order.order_number} ditolak: ${data.reason}`);
    return { ok: true };
  });

export const adminSetShipping = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ orderId: z.string().uuid(), courier: z.string().min(1).max(40), tracking_number: z.string().min(1).max(80) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin.from("orders").select("user_id, order_number").eq("id", data.orderId).single();
    await supabaseAdmin.from("orders").update({ courier: data.courier, tracking_number: data.tracking_number }).eq("id", data.orderId);
    await pushStatus(supabaseAdmin, data.orderId, order.user_id, "dikirim", `Resi ${data.tracking_number} (${data.courier})`,
      "Pesanan dikirim", `Pesanan ${order.order_number} dikirim via ${data.courier}, resi ${data.tracking_number}.`);
    return { ok: true };
  });

export const adminUpdateStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      orderId: z.string().uuid(),
      status: z.enum(["dikemas", "dikirim", "dalam_perjalanan", "selesai", "dibatalkan"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ORDER_STATUS_LABEL } = await import("./constants");
    const { data: order } = await supabaseAdmin.from("orders").select("user_id, order_number").eq("id", data.orderId).single();
    const label = (ORDER_STATUS_LABEL as Record<string, string>)[data.status] ?? data.status;
    await pushStatus(supabaseAdmin, data.orderId, order.user_id, data.status, `Status diperbarui: ${label}`,
      "Status pesanan diperbarui", `Pesanan ${order.order_number}: ${label}.`);
    return { ok: true };
  });

/* ----------------------------- CUSTOMERS ----------------------------- */
export const adminListCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profiles } = await supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: orders } = await supabaseAdmin.from("orders").select("user_id, total, status");
    const paid = ["diproses", "dikemas", "dikirim", "dalam_perjalanan", "selesai"];
    return (profiles ?? []).map((p) => {
      const userOrders = (orders ?? []).filter((o) => o.user_id === p.id);
      return {
        ...p,
        order_count: userOrders.length,
        total_spent: userOrders.filter((o) => paid.includes(o.status)).reduce((s, o) => s + Number(o.total), 0),
      };
    });
  });

/* ----------------------------- SETTINGS & CMS ----------------------------- */
export const adminGetSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("site_settings").select("data").eq("id", 1).maybeSingle();
    const s = (data?.data ?? {}) as import("./constants").SiteSettings;
    return {
      store_name: s.store_name ?? "TukangHub",
      contact_phone: s.contact_phone ?? "",
      contact_email: s.contact_email ?? "",
      banks: s.banks ?? [],
    };
  });

export const adminSaveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      store_name: z.string().max(120),
      contact_phone: z.string().max(40),
      contact_email: z.string().max(120),
      banks: z.array(z.object({ bank: z.string(), number: z.string(), holder: z.string() })),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("site_settings").update({ data: data as any, updated_at: new Date().toISOString() }).eq("id", 1);
    return { ok: true };
  });

export const adminListCms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: banners }, { data: testimonials }, { data: faqs }, { data: articles }] = await Promise.all([
      supabaseAdmin.from("banners").select("*").order("sort_order"),
      supabaseAdmin.from("testimonials").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("faqs").select("*").order("sort_order"),
      supabaseAdmin.from("articles").select("*").order("created_at", { ascending: false }),
    ]);
    return { banners: banners ?? [], testimonials: testimonials ?? [], faqs: faqs ?? [], articles: articles ?? [] };
  });

export const adminSaveCms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      table: z.enum(["banners", "testimonials", "faqs", "articles"]),
      id: z.string().uuid().optional(),
      values: z.record(z.string(), z.any()),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) await supabaseAdmin.from(data.table).update(data.values).eq("id", data.id);
    else await supabaseAdmin.from(data.table).insert(data.values as any);
    return { ok: true };
  });

export const adminDeleteCms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ table: z.enum(["banners", "testimonials", "faqs", "articles"]), id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from(data.table).delete().eq("id", data.id);
    return { ok: true };
  });

export const grantAdminSelf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("Admin sudah ada. Hubungi admin untuk akses.");
    await supabaseAdmin.from("user_roles").insert({ user_id: context.userId, role: "admin" });
    return { ok: true };
  });