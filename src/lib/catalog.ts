import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  brand: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  image_alt: string;
  is_active: boolean;
  sort_order: number;
};

export const WHATSAPP_NUMBER = "250796604901";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const DELIVERY_FEE = 2000;

export const formatRwf = (value: number) => `${value.toLocaleString("en-US")} RWF`;

export async function fetchActiveProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, brand, name, description, price, image_url, image_alt, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Product[];
}

export const productsQueryOptions = queryOptions({
  queryKey: ["products", "active"],
  queryFn: fetchActiveProducts,
});
