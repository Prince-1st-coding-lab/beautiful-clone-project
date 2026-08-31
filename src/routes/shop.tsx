import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { CartDrawer } from "@/components/CartDrawer";
import { ProductCard } from "@/components/ProductCard";
import { ProductDrawer } from "@/components/ProductDrawer";
import { SiteHeader } from "@/components/SiteHeader";
import { productsQueryOptions, type Product } from "@/lib/catalog";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop Authentic Skincare & Makeup — Beautècosmetics Rwanda" },
      {
        name: "description",
        content:
          "Browse our full catalogue of authentic skincare and beauty products in Kigali. Filter by brand, add to cart and check out with MoMo or PayU.",
      },
      { property: "og:title", content: "Shop Authentic Skincare & Makeup — Beautècosmetics Rwanda" },
      {
        property: "og:description",
        content:
          "The full Beautècosmetics catalogue: authentic global beauty brands with fast Kigali delivery.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShopPage,
});

type SortKey = "featured" | "price-asc" | "price-desc";

const sorts: { id: SortKey; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price ↑" },
  { id: "price-desc", label: "Price ↓" },
];

function ShopPage() {
  const { data: products = [], isLoading } = useQuery(productsQueryOptions);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("all");
  const [sort, setSort] = useState<SortKey>("featured");
  const [active, setActive] = useState<Product | null>(null);

  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).sort(),
    [products],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesBrand = brand === "all" || product.brand === brand;
      const matchesTerm =
        term === "" ||
        `${product.name} ${product.brand} ${product.description}`.toLowerCase().includes(term);
      return matchesBrand && matchesTerm;
    });

    if (sort === "price-asc") return filtered.slice().sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return filtered.slice().sort((a, b) => b.price - a.price);
    return filtered;
  }, [products, search, brand, sort]);

  const chipClass = (isActive: boolean) =>
    `whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
      isActive ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
    }`;

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-background font-sans text-foreground">
      <SiteHeader />

      <header className="px-4 pb-4 pt-6">
        <h1 className="font-serif text-3xl font-bold leading-tight">Shop all products</h1>
        <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
          Authentic brands · Kigali delivery
        </p>

        <div className="relative mt-5">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label className="sr-only" htmlFor="shop-search">
            Search products
          </label>
          <input
            id="shop-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or brands"
            className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button type="button" onClick={() => setBrand("all")} className={chipClass(brand === "all")}>
            All
          </button>
          {brands.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setBrand(item)}
              className={chipClass(brand === item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Sort
          </span>
          {sorts.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSort(option.id)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors ${
                sort === option.id ? "bg-secondary text-foreground" : "text-muted-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 pb-24">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : visible.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No products match your search.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} onOpen={setActive} />
            ))}
          </div>
        )}
      </main>

      <ProductDrawer product={active} onClose={() => setActive(null)} />
      <CartDrawer />
    </div>
  );
}
