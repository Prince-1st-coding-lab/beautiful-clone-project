import { Check, Plus } from "lucide-react";

import { formatRwf, productCover, type Product } from "@/lib/catalog";
import { useCart } from "@/lib/cart";

export function ProductCard({
  product,
  onOpen,
}: {
  product: Product;
  onOpen: (product: Product) => void;
}) {
  const { add, qtyOf, openCart } = useCart();
  const cover = productCover(product);
  const qty = qtyOf(product.id);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => onOpen(product)}
        aria-label={`View ${product.name}`}
        className="relative block w-full overflow-hidden bg-muted"
      >
        {cover.url ? (
          <img
            src={cover.url}
            alt={cover.alt}
            width={512}
            height={512}
            loading="lazy"
            className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="aspect-square w-full bg-muted" />
        )}
      </button>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-[10px] font-bold uppercase tracking-tighter text-primary">
          {product.brand}
        </span>
        <button
          type="button"
          onClick={() => onOpen(product)}
          className="text-left text-sm font-semibold leading-snug"
        >
          {product.name}
        </button>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-bold">{formatRwf(product.price)}</span>
          <button
            type="button"
            onClick={() => {
              add(product.id);
              openCart();
            }}
            aria-label={`Add ${product.name} to cart`}
            className={`flex size-9 items-center justify-center rounded-full transition-colors ${
              qty > 0 ? "bg-primary text-primary-foreground" : "bg-foreground text-background"
            }`}
          >
            {qty > 0 ? <Check className="size-4" strokeWidth={3} /> : <Plus className="size-4" strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </article>
  );
}
