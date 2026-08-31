import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type ProductImage = {
  id: string;
  image_url: string;
  image_alt: string;
  sort_order: number;
};

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
  product_images?: ProductImage[] | null;
};

export const WHATSAPP_NUMBER = "250796604901";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const DELIVERY_FEE = 2000;

export const formatRwf = (value: number) => `${value.toLocaleString("en-US")} RWF`;

/** All gallery images for a product, always with at least the main image. */
export function productImages(product: Product): { url: string; alt: string }[] {
  const gallery = (product.product_images ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter((image) => image.image_url.trim() !== "")
    .map((image) => ({ url: image.image_url, alt: image.image_alt || product.name }));

  if (gallery.length > 0) return gallery;
  if (product.image_url) return [{ url: product.image_url, alt: product.image_alt || product.name }];
  return [];
}

export const productCover = (product: Product) =>
  productImages(product)[0] ?? { url: "", alt: product.name };

export async function fetchActiveProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, brand, name, description, price, image_url, image_alt, is_active, sort_order, product_images(id, image_url, image_alt, sort_order)",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Product[];
}

export const productsQueryOptions = queryOptions({
  queryKey: ["products", "active"],
  queryFn: fetchActiveProducts,
});
