import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";

import { useCart } from "@/lib/cart";

export function SiteHeader() {
  const { count, hydrated, openCart } = useCart();

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-secondary bg-background/80 px-4 py-3 backdrop-blur-md">
      <Link to="/" className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
          <span className="font-serif text-xs font-bold italic text-primary">B</span>
        </div>
        <span className="font-serif text-lg font-bold tracking-tight">Beautè Rwanda</span>
      </Link>

      <div className="flex items-center gap-4">
        <Link
          to="/shop"
          className="text-xs font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{ className: "text-xs font-bold uppercase tracking-wide text-foreground" }}
        >
          Shop
        </Link>
        <button
          type="button"
          onClick={openCart}
          aria-label="Open cart"
          className="relative text-muted-foreground transition-colors hover:text-foreground"
        >
          <ShoppingBag className="size-5" strokeWidth={2} />
          {hydrated && count > 0 && (
            <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {count}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
