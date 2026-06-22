import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const checkoutSchema = z.object({
  recipient_name: z.string().min(2).max(120),
  recipient_phone: z.string().min(6).max(20),
  province: z.string().min(1).max(80),
  city: z.string().min(1).max(80),
  district: z.string().max(80).optional().default(""),
  village: z.string().max(80).optional().default(""),
  postal_code: z.string().max(10).optional().default(""),
  full_address: z.string().min(5).max(500),
  courier: z.string().min(1).max(40),
  payment_method: z.string().min(1).max(40),
  save_address: z.boolean().optional(),
});

export const checkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => checkoutSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { SHIPPING_COST } = await import("./constants");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Load cart items as the user (RLS ok)
    const { data: cart } = await supabase.from("carts").select("id").eq("user_id", userId).maybeSingle();
    if (!cart) throw new Error("Keranjang kosong");
    const { data: items } = await supabase
      .from("cart_items")
      .select("product_id, qty, price, products(name, stock)")
      .eq("cart_id", cart.id);
    if (!items || items.length === 0) throw new Error("Keranjang kosong");

    // Validate stock
    for (const it of items as any[]) {
      if (it.qty > (it.products?.stock ?? 0)) {
        throw new Error(`Stok tidak cukup untuk ${it.products?.name ?? "produk"}`);
      }
    }

    const subtotal = (items as any[]).reduce((s, it) => s + Number(it.price) * it.qty, 0);
    const shipping = (SHIPPING_COST as Record<string, number>)[data.courier] ?? 20000;
    const total = subtotal + shipping;

    const { data: orderNumberData, error: onErr } = await supabaseAdmin.rpc("generate_order_number");
    if (onErr) throw onErr;
    const orderNumber = orderNumberData as unknown as string;

    const { data: order, error: ordErr } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: userId,
        recipient_name: data.recipient_name,
        recipient_phone: data.recipient_phone,
        shipping_address: data.full_address,
        province: data.province, city: data.city, district: data.district,
        village: data.village, postal_code: data.postal_code,
        subtotal, shipping_cost: shipping, total,
        payment_method: data.payment_method,
        courier: data.courier,
        status: "menunggu_pembayaran",
      })
      .select("id, order_number")
      .single();
    if (ordErr) throw ordErr;

    await supabaseAdmin.from("order_items").insert(
      (items as any[]).map((it) => ({
        order_id: order.id,
        product_id: it.product_id,
        product_name: it.products?.name ?? "Produk",
        qty: it.qty,
        price: it.price,
      })),
    );

    // Decrement stock
    for (const it of items as any[]) {
      const newStock = Math.max(0, (it.products?.stock ?? 0) - it.qty);
      await supabaseAdmin.from("products").update({ stock: newStock }).eq("id", it.product_id);
    }

    await supabaseAdmin.from("order_status_history").insert({
      order_id: order.id, status: "menunggu_pembayaran", notes: "Pesanan dibuat",
    });
    await supabaseAdmin.from("notifications").insert({
      user_id: userId, title: "Pesanan dibuat",
      body: `Pesanan ${order.order_number} berhasil dibuat. Silakan lakukan pembayaran.`,
    });

    if (data.save_address) {
      await supabase.from("shipping_addresses").insert({
        user_id: userId, recipient_name: data.recipient_name, phone: data.recipient_phone,
        province: data.province, city: data.city, district: data.district,
        village: data.village, postal_code: data.postal_code, full_address: data.full_address,
      });
    }

    // Clear cart
    await supabase.from("cart_items").delete().eq("cart_id", cart.id);

    return { orderNumber: order.order_number };
  });

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("orders")
      .select("id, order_number, total, status, created_at, courier, payment_method")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const getOrderByNumber = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderNumber: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: order } = await supabase
      .from("orders").select("*").eq("order_number", data.orderNumber).maybeSingle();
    if (!order) return null;
    const [{ data: items }, { data: payment }, { data: history }] = await Promise.all([
      supabase.from("order_items").select("*").eq("order_id", order.id),
      supabase.from("payment_confirmations").select("*").eq("order_id", order.id).order("uploaded_at", { ascending: false }).maybeSingle(),
      supabase.from("order_status_history").select("*").eq("order_id", order.id).order("created_at", { ascending: true }),
    ]);
    return { order, items: items ?? [], payment, history: history ?? [] };
  });

export const submitPaymentProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      orderId: z.string().uuid(),
      transfer_bank: z.string().min(1).max(40),
      sender_name: z.string().min(2).max(120),
      amount: z.number().min(0),
      proof_image: z.string().max(500).optional().default(""),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: order } = await supabase
      .from("orders").select("id, order_number").eq("id", data.orderId).maybeSingle();
    if (!order) throw new Error("Pesanan tidak ditemukan");
    await supabase.from("payment_confirmations").insert({
      order_id: data.orderId,
      transfer_bank: data.transfer_bank,
      sender_name: data.sender_name,
      amount: data.amount,
      proof_image: data.proof_image || null,
      status: "pending",
    });
    await supabase.from("orders").update({ status: "menunggu_verifikasi" }).eq("id", data.orderId);
    await supabase.from("order_status_history").insert({
      order_id: data.orderId, status: "menunggu_verifikasi", notes: "Bukti transfer diunggah",
    });
    await supabase.from("notifications").insert({
      user_id: userId, title: "Bukti transfer diterima",
      body: `Bukti transfer untuk ${order.order_number} sedang diverifikasi.`,
    });
    return { ok: true };
  });

export const getCustomerStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("orders").select("status").eq("user_id", context.userId);
    const rows = data ?? [];
    const total = rows.length;
    const done = rows.filter((r) => r.status === "selesai").length;
    const active = rows.filter((r) => !["selesai", "ditolak", "dibatalkan"].includes(r.status)).length;
    return { total, done, active };
  });

export const getNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("notifications").select("*").eq("user_id", context.userId)
      .order("created_at", { ascending: false }).limit(20);
    return data ?? [];
  });