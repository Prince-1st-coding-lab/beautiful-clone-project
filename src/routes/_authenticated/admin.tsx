import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, LogOut, Package, Plus, Trash2, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { formatRwf, type Product } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Store Dashboard — Beautècosmetics Rwanda" },
      {
        name: "description",
        content:
          "Manage products, update prices and review customer orders for Beautècosmetics Rwanda.",
      },
      { property: "og:title", content: "Store Dashboard — Beautècosmetics Rwanda" },
      {
        property: "og:description",
        content: "Private dashboard for products, prices and orders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type OrderRow = {
  id: string;
  reference: string;
  customer_name: string;
  phone: string;
  district: string;
  address: string;
  notes: string;
  payment_method: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  created_at: string;
  order_items: { id: string; product_name: string; unit_price: number; quantity: number }[];
};

const STATUSES = ["pending", "paid", "delivered", "cancelled"] as const;

const inputClass =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary";
const labelClass =
  "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

const emptyProduct = {
  brand: "",
  name: "",
  description: "",
  price: 0,
  image_url: "",
  image_alt: "",
  is_active: true,
  sort_order: 0,
};

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"products" | "orders">("products");

  const roleQuery = useQuery({
    queryKey: ["my-role"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return { isAdmin: false, email: "" };
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      return { isAdmin: Boolean(data), email: userData.user?.email ?? "" };
    },
  });

  const claimAdmin = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("claim_admin");
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-role"] }),
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (roleQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!roleQuery.data?.isAdmin) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 bg-background px-6 text-center font-sans text-foreground">
        <h1 className="font-serif text-2xl font-bold">Admin access needed</h1>
        <p className="text-sm text-muted-foreground">
          You are signed in as {roleQuery.data?.email}. If you are the store owner and no admin
          exists yet, claim access below.
        </p>
        <button
          type="button"
          onClick={() => claimAdmin.mutate()}
          disabled={claimAdmin.isPending}
          className="rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground disabled:opacity-60"
        >
          Claim admin access
        </button>
        {claimAdmin.data === false && (
          <p className="text-xs text-destructive">
            An admin already exists. Ask them to grant you access.
          </p>
        )}
        <button onClick={signOut} className="text-xs font-semibold text-muted-foreground underline">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-background pb-16 font-sans text-foreground">
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-secondary bg-background/90 px-4 py-3 backdrop-blur-md">
        <div>
          <span className="font-serif text-lg font-bold tracking-tight">Store dashboard</span>
          <p className="text-[11px] text-muted-foreground">{roleQuery.data.email}</p>
        </div>
        <button
          type="button"
          onClick={signOut}
          aria-label="Sign out"
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
        >
          <LogOut className="size-3.5" /> Sign out
        </button>
      </nav>

      <div className="flex gap-2 px-4 py-4">
        {(["products", "orders"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ${
              tab === key ? "bg-primary text-primary-foreground" : "border border-border"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {tab === "products" ? <ProductsTab /> : <OrdersTab />}
    </div>
  );
}

function ProductsTab() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<null | (Partial<Product> & { id?: string })>(null);

  const productsQuery = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["products", "active"] });
  };

  const saveProduct = useMutation({
    mutationFn: async (product: Partial<Product> & { id?: string }) => {
      const payload = {
        brand: product.brand ?? "",
        name: product.name ?? "",
        description: product.description ?? "",
        price: Number(product.price ?? 0),
        image_url: product.image_url ?? "",
        image_alt: product.image_alt ?? product.name ?? "",
        is_active: product.is_active ?? true,
        sort_order: Number(product.sort_order ?? 0),
      };
      const query = product.id
        ? supabase.from("products").update(payload).eq("id", product.id)
        : supabase.from("products").insert(payload);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      setEditing(null);
      invalidate();
    },
  });

  const quickPrice = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: number }) => {
      const { error } = await supabase.from("products").update({ price }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("products").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return (
    <section className="space-y-4 px-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold">Products</h2>
        <button
          type="button"
          onClick={() => setEditing({ ...emptyProduct })}
          className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-bold uppercase text-background"
        >
          <Plus className="size-3.5" /> New
        </button>
      </div>

      {productsQuery.isLoading && <Loader2 className="size-5 animate-spin text-primary" />}
      {saveProduct.error && (
        <p className="text-xs text-destructive">{(saveProduct.error as Error).message}</p>
      )}

      <div className="flex flex-col gap-3">
        {(productsQuery.data ?? []).map((product) => (
          <div key={product.id} className="rounded-2xl border border-border bg-card p-3">
            <div className="flex gap-3">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.image_alt || product.name}
                  loading="lazy"
                  className="size-16 flex-none rounded-xl bg-muted object-cover"
                />
              ) : (
                <div className="flex size-16 flex-none items-center justify-center rounded-xl bg-muted">
                  <Package className="size-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                  {product.brand}
                </p>
                <p className="text-sm font-semibold leading-snug">{product.name}</p>
                <div className="mt-2 flex items-center gap-2">
                  <label className="sr-only" htmlFor={`price-${product.id}`}>
                    Price for {product.name}
                  </label>
                  <input
                    id={`price-${product.id}`}
                    type="number"
                    defaultValue={product.price}
                    onBlur={(e) => {
                      const price = Number(e.target.value);
                      if (price !== product.price) quickPrice.mutate({ id: product.id, price });
                    }}
                    className="w-28 rounded-lg border border-border bg-background px-2 py-1 text-sm font-bold"
                  />
                  <span className="text-xs text-muted-foreground">RWF</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs">
              <button
                type="button"
                onClick={() => setEditing(product)}
                className="rounded-full border border-border px-3 py-1.5 font-semibold"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() =>
                  toggleActive.mutate({ id: product.id, is_active: !product.is_active })
                }
                className={`rounded-full px-3 py-1.5 font-semibold ${
                  product.is_active ? "bg-secondary" : "border border-border text-muted-foreground"
                }`}
              >
                {product.is_active ? "Visible in shop" : "Hidden"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete "${product.name}"?`)) deleteProduct.mutate(product.id);
                }}
                aria-label={`Delete ${product.name}`}
                className="ml-auto flex items-center gap-1 rounded-full px-3 py-1.5 font-semibold text-destructive"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-background p-5 sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">
                {editing.id ? "Edit product" : "New product"}
              </h3>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelClass} htmlFor="p-brand">Brand</label>
                <input id="p-brand" className={inputClass} value={editing.brand ?? ""}
                  onChange={(e) => setEditing({ ...editing, brand: e.target.value })} />
              </div>
              <div>
                <label className={labelClass} htmlFor="p-name">Product name</label>
                <input id="p-name" className={inputClass} value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label className={labelClass} htmlFor="p-desc">Short description</label>
                <input id="p-desc" className={inputClass} value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="p-price">Price (RWF)</label>
                  <input id="p-price" type="number" className={inputClass} value={editing.price ?? 0}
                    onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="p-order">Sort order</label>
                  <input id="p-order" type="number" className={inputClass} value={editing.sort_order ?? 0}
                    onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="p-image">Image URL</label>
                <input id="p-image" className={inputClass} value={editing.image_url ?? ""}
                  placeholder="/products/product-cerave.jpg or https://..."
                  onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} />
              </div>
              <div>
                <label className={labelClass} htmlFor="p-alt">Image description</label>
                <input id="p-alt" className={inputClass} value={editing.image_alt ?? ""}
                  onChange={(e) => setEditing({ ...editing, image_alt: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_active ?? true}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                Show in the shop
              </label>
              {editing.id ? (
                <GalleryEditor productId={editing.id} />
              ) : (
                <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                  Save the product first to add extra slideshow images.
                </p>
              )}
              <button
                type="button"
                onClick={() => saveProduct.mutate(editing)}
                disabled={saveProduct.isPending || !(editing.name ?? "").trim()}
                className="mt-2 w-full rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground disabled:opacity-60"
              >
                Save product
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function GalleryEditor({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");

  const imagesQuery = useQuery({
    queryKey: ["admin-product-images", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_images")
        .select("id, image_url, image_alt, sort_order")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-product-images", productId] });
    queryClient.invalidateQueries({ queryKey: ["products", "active"] });
  };

  const addImage = useMutation({
    mutationFn: async () => {
      const nextOrder = (imagesQuery.data ?? []).length;
      const { error } = await supabase.from("product_images").insert({
        product_id: productId,
        image_url: url.trim(),
        image_alt: alt.trim(),
        sort_order: nextOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setUrl("");
      setAlt("");
      invalidate();
    },
  });

  const removeImage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const moveImage = useMutation({
    mutationFn: async ({ index, dir }: { index: number; dir: -1 | 1 }) => {
      const list = imagesQuery.data ?? [];
      const target = list[index + dir];
      const current = list[index];
      if (!target || !current) return;
      const a = await supabase
        .from("product_images")
        .update({ sort_order: target.sort_order })
        .eq("id", current.id);
      if (a.error) throw a.error;
      const b = await supabase
        .from("product_images")
        .update({ sort_order: current.sort_order })
        .eq("id", target.id);
      if (b.error) throw b.error;
    },
    onSuccess: invalidate,
  });

  const images = imagesQuery.data ?? [];

  return (
    <div className="rounded-xl border border-border p-3">
      <p className={labelClass}>Slideshow images</p>
      {imagesQuery.isLoading && <Loader2 className="size-4 animate-spin text-primary" />}
      <div className="flex flex-col gap-2">
        {images.map((image, index) => (
          <div key={image.id} className="flex items-center gap-2">
            <img
              src={image.image_url}
              alt={image.image_alt || "Product image"}
              className="size-10 flex-none rounded-lg bg-muted object-cover"
            />
            <span className="flex-1 truncate text-xs text-muted-foreground">{image.image_url}</span>
            <button
              type="button"
              aria-label="Move image up"
              disabled={index === 0}
              onClick={() => moveImage.mutate({ index, dir: -1 })}
              className="rounded-full border border-border px-2 py-1 text-xs disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              aria-label="Move image down"
              disabled={index === images.length - 1}
              onClick={() => moveImage.mutate({ index, dir: 1 })}
              className="rounded-full border border-border px-2 py-1 text-xs disabled:opacity-30"
            >
              ↓
            </button>
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => removeImage.mutate(image.id)}
              className="text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        {!imagesQuery.isLoading && images.length === 0 && (
          <p className="text-xs text-muted-foreground">No extra images yet.</p>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <input
          className={inputClass}
          value={url}
          placeholder="Image URL"
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          className={inputClass}
          value={alt}
          placeholder="Image description"
          onChange={(e) => setAlt(e.target.value)}
        />
        <button
          type="button"
          disabled={!url.trim() || addImage.isPending}
          onClick={() => addImage.mutate()}
          className="w-full rounded-full border border-border px-4 py-2 text-xs font-bold uppercase disabled:opacity-50"
        >
          Add image
        </button>
      </div>
    </div>
  );
}

function OrdersTab() {
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(id, product_name, unit_price, quantity)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  const orders = ordersQuery.data ?? [];
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <section className="space-y-4 px-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-muted p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Orders</p>
          <p className="font-serif text-2xl font-bold">{orders.length}</p>
        </div>
        <div className="rounded-2xl bg-muted p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Value</p>
          <p className="font-serif text-2xl font-bold">{formatRwf(revenue)}</p>
        </div>
      </div>

      {ordersQuery.isLoading && <Loader2 className="size-5 animate-spin text-primary" />}
      {!ordersQuery.isLoading && orders.length === 0 && (
        <p className="text-sm text-muted-foreground">No orders yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <article key={order.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  {order.reference}
                </p>
                <p className="text-sm font-semibold">{order.customer_name}</p>
                <a href={`tel:${order.phone}`} className="text-xs text-muted-foreground underline">
                  {order.phone}
                </a>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatRwf(order.total)}</p>
                <p className="text-[11px] uppercase text-muted-foreground">
                  {order.payment_method === "momo" ? "MoMo" : "PayU"}
                </p>
              </div>
            </div>

            <ul className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
              {order.order_items?.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>{item.product_name} × {item.quantity}</span>
                  <span>{formatRwf(item.unit_price * item.quantity)}</span>
                </li>
              ))}
              <li className="pt-1 text-foreground">
                {order.address}
                {order.district ? `, ${order.district}` : ""}
              </li>
              {order.notes && <li>Notes: {order.notes}</li>}
              <li>{new Date(order.created_at).toLocaleString()}</li>
            </ul>

            <div className="mt-3 flex flex-wrap gap-2">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatus.mutate({ id: order.id, status })}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                    order.status === status
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
