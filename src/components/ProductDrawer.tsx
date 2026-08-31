import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";

import { ImageSlider } from "@/components/ImageSlider";
import { formatRwf, productImages, type Product } from "@/lib/catalog";
import { useCart } from "@/lib/cart";

export function ProductDrawer({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const { add, openCart } = useCart();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setQty(1);
  }, [product?.id]);

  if (!product) return null;

  const images = productImages(product);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-stretch sm:justify-end">
      <button
        type="button"
        aria-label="Close product details"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/50 backdrop-blur-[2px]"
      />
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-y-auto rounded-t-3xl bg-background p-5 shadow-2xl sm:max-h-none sm:rounded-none sm:rounded-l-3xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-tighter text-primary">
              {product.brand}
            </span>
            <h2 className="font-serif text-xl font-bold leading-tight">{product.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 flex-none items-center justify-center rounded-full border border-border"
          >
            <X className="size-4" />
          </button>
        </div>

        <ImageSlider images={images} />

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-lg font-bold">{formatRwf(product.price * qty)}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex size-9 items-center justify-center rounded-full border border-border disabled:opacity-30"
              disabled={qty <= 1}
            >
              <Minus className="size-4" />
            </button>
            <span className="w-5 text-center text-sm font-semibold">{qty}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              className="flex size-9 items-center justify-center rounded-full bg-foreground text-background"
            >
              <Plus className="size-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            add(product.id, qty);
            onClose();
            openCart();
          }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-transform active:scale-[0.98]"
        >
          <ShoppingBag className="size-4" /> Add to cart
        </button>
      </div>
    </div>
  );
}
