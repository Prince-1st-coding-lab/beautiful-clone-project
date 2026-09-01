import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, Phone } from "lucide-react";

import heroImage from "@/assets/hero-skincare.jpg";
import categorySkincare from "@/assets/category-skincare.jpg";
import categoryMakeup from "@/assets/category-makeup.jpg";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductCard } from "@/components/ProductCard";
import { ProductDrawer } from "@/components/ProductDrawer";
import { CartDrawer } from "@/components/CartDrawer";
import { productsQueryOptions, type Product } from "@/lib/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Beautècosmetics Rwanda — Authentic Skincare in Kigali" },
      {
        name: "description",
        content:
          "Shop 100% authentic skincare and beauty products in Kigali. Fast delivery, wholesale prices and easy WhatsApp ordering with MoMo or PayU.",
      },
      {
        property: "og:title",
        content: "Beautècosmetics Rwanda — Authentic Skincare in Kigali",
      },
      {
        property: "og:description",
        content:
          "Authentic global beauty brands delivered across Kigali. Order on WhatsApp and pay with MoMo or PayU.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const WHATSAPP_URL = "https://wa.me/250796604901";


function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    </svg>
  );
}

const features = [
  "100% Authentic Brands",
  "Fast Kigali Delivery",
  "Wholesale Available",
  "Open 24 Hours",
];

const categories = [
  {
    image: categorySkincare,
    alt: "Creamy white face cream texture",
    name: "Skincare Essentials",
    count: "120+ Products",
  },
  {
    image: categoryMakeup,
    alt: "Liquid foundation on a soft pink background",
    name: "Face & Lips",
    count: "85+ Products",
  },
];

function Index() {
  const { data: products = [] } = useQuery(productsQueryOptions);
  const [active, setActive] = useState<Product | null>(null);

  return (

    <div className="mx-auto min-h-screen max-w-3xl bg-background font-sans text-foreground">
      <SiteHeader />


      {/* Hero Section */}
      <section className="px-4 py-6">
        <div className="relative overflow-hidden rounded-3xl bg-secondary">
          <img
            src={heroImage}
            alt="Premium skincare bottles with pink roses on marble"
            width={800}
            height={1000}
            className="aspect-[4/5] w-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-brand-deep/60 via-transparent to-transparent p-6">
            <span className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/90">
              ✨ Rwanda's #1 Choice
            </span>
            <h1 className="mb-4 font-serif text-3xl leading-tight text-white">
              Global Beauty,
              <br />
              <span className="italic">Delivered Locally.</span>
            </h1>
            <Link
              to="/order"
              className="w-fit rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary shadow-lg transition-transform active:scale-95"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Strip */}
      <div className="flex gap-4 overflow-x-auto px-4 pb-2">
        {features.map((feature) => (
          <div
            key={feature}
            className="flex flex-none items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2"
          >
            <div className="size-2 rounded-full bg-brand-pink" />
            <span className="whitespace-nowrap text-[11px] font-medium">{feature}</span>
          </div>
        ))}
      </div>

      {/* Shop by Category */}
      <section className="py-8">
        <div className="mb-6 flex items-end justify-between px-4">
          <div>
            <h2 className="font-serif text-2xl font-bold">Categories</h2>
            <p className="text-xs text-muted-foreground">
              Curated skincare for every skin type
            </p>
          </div>
          <Link
            to="/order"
            className="border-b border-primary/20 pb-0.5 text-xs font-semibold text-primary"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 px-4">
          {categories.map((category) => (
            <div key={category.name} className="group relative">
              <img
                src={category.image}
                alt={category.alt}
                width={512}
                height={512}
                loading="lazy"
                className="mb-2 aspect-square rounded-2xl object-cover outline-1 -outline-offset-1 outline-black/5"
              />
              <p className="text-sm font-semibold">{category.name}</p>
              <p className="text-[10px] text-muted-foreground">{category.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="bg-muted py-8">
        <div className="mb-6 px-4">
          <h2 className="font-serif text-2xl font-bold">Best Sellers</h2>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Trending in Nyarugenge
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 px-4">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} onOpen={setActive} />
          ))}
        </div>

        <div className="mt-6 px-4">
          <Link
            to="/shop"
            className="flex w-full items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold"
          >
            View all products
          </Link>
        </div>
      </section>


      {/* Wholesale & Retail CTA */}
      <section className="px-4 py-12 text-center">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-white/5" />
          <h3 className="mb-3 font-serif text-2xl">Wholesale & Retail</h3>
          <p className="mb-6 px-4 text-sm text-primary-foreground/80">
            Partner with us for authentic beauty supplies at bulk prices for your
            business.
          </p>
          <Link
            to="/order"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-bold uppercase tracking-wide text-primary"
          >
            Shop Now
            <WhatsAppIcon className="size-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground px-6 py-10 text-background">
        <h4 className="mb-4 font-serif text-xl">Beautècosmetics Rwanda</h4>
        <div className="mb-8 space-y-4 text-sm text-background/60">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-5 flex-none text-brand-pink" strokeWidth={2} />
            <p>
              Nyarugenge, Kigali, Rwanda
              <br />
              <span className="text-[10px] opacity-70">Open 24 Hours</span>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 size-5 flex-none text-brand-pink" strokeWidth={2} />
            <a href="tel:+250796604901">+250 796 604 901</a>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 pt-6">
          <p className="text-[10px] uppercase tracking-tighter text-background/40">
            © 2026 Beautècosmetics Rwanda
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/auth"
              className="text-[10px] uppercase tracking-tighter text-background/40 transition-colors hover:text-background/80"
            >
              Staff
            </Link>
            <div className="size-4 rounded-sm bg-background/30" />
            <div className="size-4 rounded-sm bg-background/30" />
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <div className="fixed bottom-6 right-6 z-[60]">
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="block animate-bounce rounded-full bg-[#25D366] p-4 text-white shadow-2xl"
        >
          <WhatsAppIcon className="size-6" />
        </a>
      </div>

      <ProductDrawer product={active} onClose={() => setActive(null)} />
      <CartDrawer />
    </div>
  );
}
