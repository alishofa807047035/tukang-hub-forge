import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export function getPublicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    },
  );
}

type AnyClient = ReturnType<typeof getPublicClient>;

export async function resolveImages(
  client: AnyClient,
  paths: string[] | null | undefined,
): Promise<string[]> {
  if (!paths || paths.length === 0) return [];
  const out: string[] = [];
  const toSign: string[] = [];
  for (const p of paths) {
    if (/^https?:\/\//.test(p)) out.push(p);
    else toSign.push(p);
  }
  if (toSign.length) {
    const { data } = await client.storage
      .from("product-images")
      .createSignedUrls(toSign, 60 * 60 * 24 * 7);
    for (const item of data ?? []) {
      if (item.signedUrl) out.push(item.signedUrl);
    }
  }
  return out;
}