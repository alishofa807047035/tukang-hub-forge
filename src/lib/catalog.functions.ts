import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface ProductDTO {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  brand: string | null;
  price: number;
  stock: number;
  weight: number;
  sku: string | null;
  images: string[];
  category_id: string | null;
  category_name: string | null;
  status: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  product_count?: number;
}

const listSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "name_asc"]).optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(48).optional(),
});

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => listSchema.parse(d ?? {}))
  .handler(async ({ data }) => {
    const { getPublicClient, resolveImages } = await import("./supabase-public.server");
    const client = getPublicClient();
    const page = data.page ?? 1;
    const pageSize = data.pageSize ?? 12;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = client
      .from("products")
      .select("*, product_categories(name, slug)", { count: "exact" })
      .eq("status", "active");

    if (data.search) query = query.ilike("name", `%${data.search}%`);
    if (data.category) {
      const { data: cat } = await client
        .from("product_categories")
        .select("id")
        .eq("slug", data.category)
        .maybeSingle();
      if (cat) query = query.eq("category_id", cat.id);
    }
    if (typeof data.minPrice === "number") query = query.gte("price", data.minPrice);
    if (typeof data.maxPrice === "number") query = query.lte("price", data.maxPrice);

    switch (data.sort) {
      case "price_asc": query = query.order("price", { ascending: true }); break;
      case "price_desc": query = query.order("price", { ascending: false }); break;
      case "name_asc": query = query.order("name", { ascending: true }); break;
      default: query = query.order("created_at", { ascending: false });
    }

    const { data: rows, count } = await query.range(from, to);
    const items: ProductDTO[] = await Promise.all(
      (rows ?? []).map(async (r: any) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        description: r.description,
        brand: r.brand,
        price: Number(r.price),
        stock: r.stock,
        weight: Number(r.weight),
        sku: r.sku,
        images: await resolveImages(client, r.images),
        category_id: r.category_id,
        category_name: r.product_categories?.name ?? null,
        status: r.status,
      })),
    );
    return { items, total: count ?? 0, page, pageSize };
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublicClient } = await import("./supabase-public.server");
  const client = getPublicClient();
  const { data } = await client
    .from("product_categories")
    .select("id, name, slug, icon")
    .order("name");
  return (data ?? []) as CategoryDTO[];
});

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { getPublicClient, resolveImages } = await import("./supabase-public.server");
    const client = getPublicClient();
    const { data: r } = await client
      .from("products")
      .select("*, product_categories(name, slug)")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!r) return null;

    const { data: reviewsRaw } = await client
      .from("reviews")
      .select("id, rating, comment, created_at, user_id")
      .eq("product_id", r.id)
      .order("created_at", { ascending: false });

    const { data: relatedRaw } = await client
      .from("products")
      .select("*, product_categories(name)")
      .eq("status", "active")
      .eq("category_id", r.category_id ?? "")
      .neq("id", r.id)
      .limit(4);

    const product: ProductDTO = {
      id: r.id, slug: r.slug, name: r.name, description: r.description,
      brand: r.brand, price: Number(r.price), stock: r.stock,
      weight: Number(r.weight), sku: r.sku,
      images: await resolveImages(client, r.images),
      category_id: r.category_id,
      category_name: (r as any).product_categories?.name ?? null,
      status: r.status,
    };
    const related: ProductDTO[] = await Promise.all(
      (relatedRaw ?? []).map(async (x: any) => ({
        id: x.id, slug: x.slug, name: x.name, description: x.description,
        brand: x.brand, price: Number(x.price), stock: x.stock,
        weight: Number(x.weight), sku: x.sku,
        images: await resolveImages(client, x.images),
        category_id: x.category_id, category_name: x.product_categories?.name ?? null,
        status: x.status,
      })),
    );
    return { product, reviews: reviewsRaw ?? [], related };
  });

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublicClient, resolveImages } = await import("./supabase-public.server");
  const client = getPublicClient();
  const [{ data: featuredRaw }, { data: categories }, { data: testimonials }, { data: banners }] =
    await Promise.all([
      client.from("products").select("*, product_categories(name)").eq("status", "active").order("created_at", { ascending: false }).limit(8),
      client.from("product_categories").select("id, name, slug, icon").order("name").limit(8),
      client.from("testimonials").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(6),
      client.from("banners").select("*").eq("is_active", true).order("sort_order"),
    ]);
  const featured: ProductDTO[] = await Promise.all(
    (featuredRaw ?? []).map(async (r: any) => ({
      id: r.id, slug: r.slug, name: r.name, description: r.description,
      brand: r.brand, price: Number(r.price), stock: r.stock,
      weight: Number(r.weight), sku: r.sku,
      images: await resolveImages(client, r.images),
      category_id: r.category_id, category_name: r.product_categories?.name ?? null,
      status: r.status,
    })),
  );
  return {
    featured,
    categories: (categories ?? []) as CategoryDTO[],
    testimonials: testimonials ?? [],
    banners: banners ?? [],
  };
});

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublicClient } = await import("./supabase-public.server");
  const client = getPublicClient();
  const { data } = await client.from("site_settings").select("data").eq("id", 1).maybeSingle();
  const settings = (data?.data ?? {}) as import("./constants").SiteSettings;
  return {
    store_name: settings.store_name ?? "TukangHub",
    contact_phone: settings.contact_phone ?? "",
    contact_email: settings.contact_email ?? "",
    banks: settings.banks ?? [],
  };
});