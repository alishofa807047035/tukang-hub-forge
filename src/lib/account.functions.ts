import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAddresses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("shipping_addresses").select("*").eq("user_id", context.userId)
      .order("is_default", { ascending: false }).order("created_at", { ascending: false });
    return data ?? [];
  });

const addressSchema = z.object({
  id: z.string().uuid().optional(),
  recipient_name: z.string().min(2).max(120),
  phone: z.string().min(6).max(20),
  province: z.string().min(1).max(80),
  city: z.string().min(1).max(80),
  district: z.string().max(80).optional().default(""),
  village: z.string().max(80).optional().default(""),
  postal_code: z.string().max(10).optional().default(""),
  full_address: z.string().min(5).max(500),
  is_default: z.boolean().optional().default(false),
});

export const saveAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => addressSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.is_default) {
      await supabase.from("shipping_addresses").update({ is_default: false }).eq("user_id", userId);
    }
    const payload = {
      user_id: userId, recipient_name: data.recipient_name, phone: data.phone,
      province: data.province, city: data.city, district: data.district,
      village: data.village, postal_code: data.postal_code,
      full_address: data.full_address, is_default: data.is_default,
    };
    if (data.id) {
      await supabase.from("shipping_addresses").update(payload).eq("id", data.id);
    } else {
      await supabase.from("shipping_addresses").insert(payload);
    }
    return { ok: true };
  });

export const deleteAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from("shipping_addresses").delete().eq("id", data.id);
    return { ok: true };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      fullname: z.string().min(2).max(120),
      phone: z.string().max(20).optional().default(""),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("profiles")
      .update({ fullname: data.fullname, phone: data.phone })
      .eq("id", context.userId);
    return { ok: true };
  });