import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface CartItemDTO {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  price: number;
  qty: number;
  stock: number;
  image: string | null;
}

async function ensureCart(supabase: any, userId: string): Promise<string> {
  const { data: existing } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

async function signImage(supabase: any, path: string | null): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const { data } = await supabase.storage
    .from("product-images")
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? null;
}

export const getCart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const cartId = await ensureCart(supabase, userId);
    const { data: rows } = await supabase
      .from("cart_items")
      .select("id, product_id, qty, price, products(name, slug, stock, images)")
      .eq("cart_id", cartId)
      .order("created_at", { ascending: true });
    const items: CartItemDTO[] = await Promise.all(
      (rows ?? []).map(async (r: any) => ({
        id: r.id,
        product_id: r.product_id,
        name: r.products?.name ?? "Produk",
        slug: r.products?.slug ?? "",
        price: Number(r.price),
        qty: r.qty,
        stock: r.products?.stock ?? 0,
        image: await signImage(supabase, r.products?.images?.[0] ?? null),
      })),
    );
    return { items };
  });

export const addToCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ productId: z.string().uuid(), qty: z.number().min(1).max(999) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const cartId = await ensureCart(supabase, userId);
    const { data: product } = await supabase
      .from("products")
      .select("price, stock")
      .eq("id", data.productId)
      .maybeSingle();
    if (!product) throw new Error("Produk tidak ditemukan");
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, qty")
      .eq("cart_id", cartId)
      .eq("product_id", data.productId)
      .maybeSingle();
    const newQty = Math.min((existing?.qty ?? 0) + data.qty, product.stock);
    if (existing) {
      await supabase.from("cart_items").update({ qty: newQty, price: product.price }).eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({
        cart_id: cartId,
        product_id: data.productId,
        qty: Math.min(data.qty, product.stock),
        price: product.price,
      });
    }
    return { ok: true };
  });

export const updateCartItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ itemId: z.string().uuid(), qty: z.number().min(1).max(999) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await context.supabase.from("cart_items").update({ qty: data.qty }).eq("id", data.itemId);
    return { ok: true };
  });

export const removeCartItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ itemId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from("cart_items").delete().eq("id", data.itemId);
    return { ok: true };
  });

export const clearCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: cart } = await supabase.from("carts").select("id").eq("user_id", userId).maybeSingle();
    if (cart) await supabase.from("cart_items").delete().eq("cart_id", cart.id);
    return { ok: true };
  });