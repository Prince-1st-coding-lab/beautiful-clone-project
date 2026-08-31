# Dedicated Shop Page + E-commerce Ordering

## What you get

**New /shop page**
- Full product catalogue in a responsive grid, with search box, brand filter chips, and sort (featured, price low→high, price high→low).
- Each card: image, brand, name, price, and an "Add to cart" button that works without leaving the page.
- Tapping a card opens a product drawer that slides up (mobile) / in from the right (desktop) with a swipeable image slideshow, full description, quantity stepper, and add-to-cart.

**Multiple product images**
- Products currently store one image. A new `product_images` table adds any number of images per product (image URL, alt text, order). Existing images stay as the first slide.
- The admin page gets fields to add/remove/reorder extra images per product.

**Persistent cart**
- Cart lives in the browser (survives refresh), shared by every page.
- Cart icon in the header shows an item-count badge; tapping it opens a cart drawer with line items, quantity steppers, remove, subtotal, delivery fee, total, and a "Checkout" button.
- Home page product cards get add-to-cart too.

**Checkout at /order**
- Becomes a real checkout: it reads the cart instead of asking you to pick products again.
- Order summary at top, then delivery details, then payment method (MTN MoMo / PayU) — same WhatsApp screenshot confirmation flow and same saved-order behaviour as today.
- Empty cart shows a "Your cart is empty — browse the shop" state.

## Technical notes

- Migration: `public.product_images` (product_id FK, image_url, image_alt, sort_order, timestamps), GRANTs for anon/authenticated/service_role, RLS: public read for images of active products, admin full manage. Backfill one row per product from `products.image_url`.
- `src/lib/cart.tsx`: React context + `localStorage` persistence (`items: {productId, qty}[]`), mounted in `__root.tsx` inside the QueryClientProvider; guard reads with a hydration effect to avoid SSR mismatch.
- `src/lib/catalog.ts`: extend the product query to embed `product_images` ordered by `sort_order`; add `productsQueryOptions` reuse for shop/home.
- New route `src/routes/shop.tsx` with its own `head()` metadata (title, description, og:*). Product drawer is state on the shop page (no `$id` route), per your choice.
- Shared UI: `src/components/ProductCard.tsx`, `ProductDrawer.tsx` (image slider via scroll-snap + dots), `CartDrawer.tsx`, `Header.tsx` with cart badge.
- `/order` refactor: replaces local `quantities` state with cart context; `placeOrder` server function and validation stay unchanged.
- Header/nav links added for Home and Shop; footer Staff link untouched.
