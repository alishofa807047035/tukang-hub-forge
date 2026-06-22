import type { Database } from "@/integrations/supabase/types";

export type OrderStatus = Database["public"]["Enums"]["order_status"];

export const COURIERS = ["JNE", "J&T", "SiCepat", "AnterAja"] as const;
export const BANKS = ["BCA", "Mandiri", "BRI", "BNI"] as const;

// Flat shipping cost per courier (placeholder, editable later)
export const SHIPPING_COST: Record<(typeof COURIERS)[number], number> = {
  JNE: 20000,
  "J&T": 18000,
  SiCepat: 19000,
  AnterAja: 17000,
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "menunggu_pembayaran",
  "menunggu_verifikasi",
  "diproses",
  "dikemas",
  "dikirim",
  "dalam_perjalanan",
  "selesai",
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  menunggu_pembayaran: "Menunggu Pembayaran",
  menunggu_verifikasi: "Menunggu Verifikasi",
  diproses: "Diproses",
  dikemas: "Dikemas",
  dikirim: "Dikirim",
  dalam_perjalanan: "Dalam Perjalanan",
  selesai: "Selesai",
  ditolak: "Ditolak",
  dibatalkan: "Dibatalkan",
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  menunggu_pembayaran: "bg-warning/10 text-warning border-warning/20",
  menunggu_verifikasi: "bg-info/10 text-info border-info/20",
  diproses: "bg-info/10 text-info border-info/20",
  dikemas: "bg-info/10 text-info border-info/20",
  dikirim: "bg-primary/10 text-primary border-primary/20",
  dalam_perjalanan: "bg-primary/10 text-primary border-primary/20",
  selesai: "bg-success/10 text-success border-success/20",
  ditolak: "bg-destructive/10 text-destructive border-destructive/20",
  dibatalkan: "bg-muted text-muted-foreground border-border",
};

export interface BankAccount {
  bank: string;
  number: string;
  holder: string;
}

export interface SiteSettings {
  store_name?: string;
  contact_phone?: string;
  contact_email?: string;
  banks?: BankAccount[];
}