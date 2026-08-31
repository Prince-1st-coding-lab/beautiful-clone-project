import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const orderSchema = z.object({
  customer_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(40),
  district: z.string().trim().max(120).default(""),
  address: z.string().trim().min(3).max(300),
  notes: z.string().trim().max(1000).default(""),
  payment_method: z.enum(["momo", "payu"]),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(50),
});

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => orderSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ids = data.items.map((i) => i.product_id);
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, name, price, is_active")
      .in("id", ids);
    if (productsError) throw new Error(productsError.message);

    const lines = data.items
      .map((item) => {
        const product = (products ?? []).find((p) => p.id === item.product_id);
        if (!product || !product.is_active) return null;
        return {
          product_id: product.id,
          product_name: product.name,
          unit_price: product.price,
          quantity: item.quantity,
        };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);

    if (lines.length === 0) throw new Error("No valid products in this order.");

    const subtotal = lines.reduce((sum, l) => sum + l.unit_price * l.quantity, 0);
    const deliveryFee = 2000;
    const reference = `BC-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        reference,
        customer_name: data.customer_name,
        phone: data.phone,
        district: data.district,
        address: data.address,
        notes: data.notes,
        payment_method: data.payment_method,
        subtotal,
        delivery_fee: deliveryFee,
        total: subtotal + deliveryFee,
        status: "pending",
      })
      .select("id, reference, subtotal, delivery_fee, total")
      .single();
    if (orderError || !order) throw new Error(orderError?.message ?? "Could not save order.");

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(lines.map((l) => ({ ...l, order_id: order.id })));
    if (itemsError) throw new Error(itemsError.message);

    return {
      reference: order.reference,
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      total: order.total,
    };
  });
