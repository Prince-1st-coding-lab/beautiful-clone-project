import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

import { DELIVERY_FEE, formatRwf, productCover, productsQueryOptions } from "@/lib/catalog";
import { useCart } from "@/lib/cart";

export function useCartLines() {
  const { items } = useCart();
  const { data: products = [] } = useQuery(productsQueryOptions);

  const lines = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return product ? { product, qty: item.qty } : null;
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);

  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const deliveryFee = lines.length > 0 ? DELIVERY_FEE : 0;

  return { lines, subtotal, deliveryFee, total: subtotal + deliveryFee };
}

export function CartDrawer() {
  const { isOpen, closeCart, setQty, remove } = useCart();
  const { lines, subtotal, deliveryFee, total } = useCartLines();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-stretch sm:justify-end">
      <button
        type="button"
        aria-label="Close cart"
        onClick={closeCart}
        className="absolute inset-0 bg-foreground/50 backdrop-blur-[2px]"
      />
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col rounded-t-3xl bg-background shadow-2xl sm:max-h-none sm:rounded-none sm:rounded-l-3xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-serif text-lg font-bold">Your cart</h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-full border border-border"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <ShoppingBag className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Your cart is empty.</p>
              <Link
                to="/shop"
                onClick={closeCart}
                className="rounded-full bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wide text-primary-foreground"
              >
                Browse the shop
              </Link>
            </div>
          ) : (
            lines.map(({ product, qty }) => {
              const cover = productCover(product);
              return (
                <div key={product.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
                  <img
                    src={cover.url}
                    alt={cover.alt}
                    width={256}
                    height={256}
                    loading="lazy"
                    className="size-16 flex-none rounded-xl bg-muted object-cover"
                  />
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug">{product.name}</p>
                      <button
                        type="button"
                        onClick={() => remove(product.id)}
                        aria-label={`Remove ${product.name}`}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{formatRwf(product.price * qty)}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Remove one ${product.name}`}
                          onClick={() => setQty(product.id, qty - 1)}
                          className="flex size-7 items-center justify-center rounded-full border border-border"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-4 text-center text-sm font-semibold">{qty}</span>
                        <button
                          type="button"
                          aria-label={`Add one ${product.name}`}
                          onClick={() => setQty(product.id, qty + 1)}
                          className="flex size-7 items-center justify-center rounded-full bg-foreground text-background"
                        >
                          <Plus className="size-3.5" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {lines.length > 0 && (
          <div className="space-y-3 border-t border-border px-5 py-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatRwf(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Delivery (Kigali)</span>
              <span>{formatRwf(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatRwf(total)}</span>
            </div>
            <Link
              to="/order"
              onClick={closeCart}
              className="flex w-full items-center justify-center rounded-full bg-primary px-6 py-4 text-sm font-bold uppercase tracking-wide text-primary-foreground"
            >
              Checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
