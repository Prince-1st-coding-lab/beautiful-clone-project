import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Copy, Loader2, Minus, Plus, ShieldCheck } from "lucide-react";

import {
  DELIVERY_FEE,
  formatRwf,
  productsQueryOptions,
  WHATSAPP_NUMBER,
  WHATSAPP_URL,
} from "@/lib/catalog";
import { placeOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/order")({
  head: () => ({
    meta: [
      { title: "Place an Order — Beautècosmetics Rwanda" },
      {
        name: "description",
        content:
          "Order authentic skincare in Kigali: pick your products, pay with MTN MoMo or PayU, then send your payment screenshot on WhatsApp.",
      },
      { property: "og:title", content: "Place an Order — Beautècosmetics Rwanda" },
      {
        property: "og:description",
        content:
          "Choose your products, pay with MoMo or PayU and confirm your delivery in Kigali.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrderPage,
});

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    </svg>
  );
}

const MOMO_NUMBER = "+250 796 604 901";
const MOMO_NAME = "BEAUTECOSMETICS RWANDA";

const paymentMethods = [
  {
    id: "momo",
    label: "MTN Mobile Money",
    hint: "Pay to our MoMo number, then send the SMS screenshot",
  },
  {
    id: "payu",
    label: "PayU (Card / Online)",
    hint: "We send a secure PayU payment link on WhatsApp",
  },
] as const;

type PaymentId = (typeof paymentMethods)[number]["id"];

const inputClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

function OrderPage() {
  const { data: catalog = [], isLoading } = useQuery(productsQueryOptions);
  const submitOrder = useServerFn(placeOrder);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<PaymentId>("momo");
  const [orderRef, setOrderRef] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const confirmed = orderRef !== "";

  const selected = useMemo(
    () =>
      catalog
        .map((item) => ({ item, qty: quantities[item.id] ?? 0 }))
        .filter((line) => line.qty > 0),
    [catalog, quantities],
  );

  const subtotal = selected.reduce((sum, l) => sum + l.item.price * l.qty, 0);
  const total = subtotal > 0 ? subtotal + DELIVERY_FEE : 0;

  const setQty = (id: string, delta: number) =>
    setQuantities((q) => ({ ...q, [id]: Math.max(0, (q[id] ?? 0) + delta) }));

  const paymentLabel = paymentMethods.find((m) => m.id === payment)!.label;

  const whatsappMessage = [
    `*New Order ${orderRef}* — Beautècosmetics Rwanda`,
    "",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Delivery: ${address}${district ? `, ${district}` : ""}`,
    notes ? `Notes: ${notes}` : "",
    "",
    "*Items*",
    ...selected.map((l) => `• ${l.item.name} x${l.qty} — ${formatRwf(l.item.price * l.qty)}`),
    "",
    `Subtotal: ${formatRwf(subtotal)}`,
    `Delivery: ${formatRwf(DELIVERY_FEE)}`,
    `*Total: ${formatRwf(total)}*`,
    `Payment: ${paymentLabel}`,
    "",
    "I am attaching my payment screenshot as proof. 📎",
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

  const handleConfirm = async () => {
    if (selected.length === 0) return setError("Please choose at least one product.");
    if (name.trim().length < 2) return setError("Please enter your full name.");
    if (phone.replace(/\D/g, "").length < 9) return setError("Please enter a valid phone number.");
    if (address.trim().length < 3) return setError("Please enter your delivery address.");
    setError("");
    setSaving(true);
    try {
      const result = await submitOrder({
        data: {
          customer_name: name.trim(),
          phone: phone.trim(),
          district: district.trim(),
          address: address.trim(),
          notes: notes.trim(),
          payment_method: payment,
          items: selected.map((l) => ({ product_id: l.item.id, quantity: l.qty })),
        },
      });
      setOrderRef(result.reference);
    } catch {
      setError("We could not save your order. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const copyMomo = async () => {
    try {
      await navigator.clipboard.writeText(MOMO_NUMBER.replace(/\s/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-background font-sans text-foreground">
      <nav className="sticky top-0 z-50 flex items-center gap-3 border-b border-secondary bg-background/80 px-4 py-3 backdrop-blur-md">
        <Link
          to="/"
          aria-label="Back to home"
          className="flex size-8 items-center justify-center rounded-full border border-border"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <span className="font-serif text-lg font-bold tracking-tight">
          {confirmed ? "Confirm & Pay" : "Place Your Order"}
        </span>
      </nav>

      {!confirmed ? (
        <div className="space-y-8 px-4 py-6 pb-32">
          {/* Products */}
          <section>
            <h1 className="font-serif text-2xl font-bold">Choose your products</h1>
            <p className="mb-4 text-xs text-muted-foreground">
              Tap + to add items. Delivery in Kigali is {formatRwf(DELIVERY_FEE)}.
            </p>
            {isLoading && <Loader2 className="size-5 animate-spin text-primary" />}
            <div className="flex flex-col gap-3">
              {catalog.map((item) => {
                const qty = quantities[item.id] ?? 0;
                return (
                  <div
                    key={item.id}
                    className={`flex gap-3 rounded-2xl border bg-card p-3 transition-colors ${
                      qty > 0 ? "border-primary" : "border-border"
                    }`}
                  >
                    <img
                      src={item.image_url}
                      alt={item.image_alt || item.name}
                      width={512}
                      height={512}
                      loading="lazy"
                      className="size-20 flex-none rounded-xl bg-muted object-cover"
                    />
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                          {item.brand}
                        </span>
                        <h2 className="text-sm font-semibold leading-snug">{item.name}</h2>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">{formatRwf(item.price)}</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            aria-label={`Remove one ${item.name}`}
                            onClick={() => setQty(item.id, -1)}
                            disabled={qty === 0}
                            className="flex size-8 items-center justify-center rounded-full border border-border disabled:opacity-30"
                          >
                            <Minus className="size-4" />
                          </button>
                          <span className="w-4 text-center text-sm font-semibold">{qty}</span>
                          <button
                            type="button"
                            aria-label={`Add one ${item.name}`}
                            onClick={() => setQty(item.id, 1)}
                            className="flex size-8 items-center justify-center rounded-full bg-foreground text-background"
                          >
                            <Plus className="size-4" strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Details */}
          <section>
            <h2 className="mb-4 font-serif text-2xl font-bold">Your details</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="name">Full name</label>
                <input id="name" className={inputClass} value={name} placeholder="Uwase Marie"
                  onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="phone">Phone (WhatsApp)</label>
                <input id="phone" type="tel" className={inputClass} value={phone}
                  placeholder="+250 7.. .. .. .." onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="district">District / City</label>
                <input id="district" className={inputClass} value={district} placeholder="Nyarugenge, Kigali"
                  onChange={(e) => setDistrict(e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="address">Delivery address</label>
                <input id="address" className={inputClass} value={address} placeholder="Street, house or landmark"
                  onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="notes">Notes (optional)</label>
                <textarea id="notes" rows={3} className={inputClass} value={notes}
                  placeholder="Preferred delivery time, extra items..."
                  onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          </section>

          {/* Payment */}
          <section>
            <h2 className="mb-4 font-serif text-2xl font-bold">Payment method</h2>
            <div className="flex flex-col gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPayment(method.id)}
                  className={`flex items-center gap-3 rounded-2xl border bg-card p-4 text-left transition-colors ${
                    payment === method.id ? "border-primary bg-secondary/40" : "border-border"
                  }`}
                >
                  <span
                    className={`flex size-5 flex-none items-center justify-center rounded-full border ${
                      payment === method.id ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    }`}
                  >
                    {payment === method.id && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{method.label}</span>
                    <span className="block text-xs text-muted-foreground">{method.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Summary */}
          <section className="rounded-2xl bg-muted p-4">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">Order summary</h2>
            {selected.length === 0 ? (
              <p className="text-xs text-muted-foreground">No products selected yet.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {selected.map((l) => (
                  <div key={l.item.id} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">
                      {l.item.name} × {l.qty}
                    </span>
                    <span className="font-medium">{formatRwf(l.item.price * l.qty)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span>{formatRwf(DELIVERY_FEE)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <span>Total</span>
                  <span>{formatRwf(total)}</span>
                </div>
              </div>
            )}
          </section>

          {error && (
            <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive">
              {error}
            </p>
          )}

          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-3xl border-t border-border bg-background/95 p-4 backdrop-blur">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              Confirm order · {formatRwf(total)}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 px-4 py-6 pb-16">
          <div className="rounded-3xl bg-primary p-6 text-primary-foreground">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/80">
              Order {orderRef}
            </span>
            <h1 className="mt-2 font-serif text-2xl">Almost done, {name.split(" ")[0]}!</h1>
            <p className="mt-2 text-sm text-primary-foreground/80">
              Pay {formatRwf(total)} with {paymentLabel}, then send us the screenshot on
              WhatsApp to confirm your delivery.
            </p>
          </div>

          {payment === "momo" ? (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-3 font-serif text-lg font-bold">MTN Mobile Money</h2>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li>1. Dial *182*1*1# or open MoMo app.</li>
                <li>2. Send <strong className="text-foreground">{formatRwf(total)}</strong> to:</li>
              </ol>
              <div className="my-3 flex items-center justify-between rounded-xl bg-muted px-4 py-3">
                <div>
                  <p className="text-base font-bold">{MOMO_NUMBER}</p>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{MOMO_NAME}</p>
                </div>
                <button
                  type="button"
                  onClick={copyMomo}
                  className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                3. Use reference <strong className="text-foreground">{orderRef}</strong> and
                screenshot the confirmation SMS.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-3 font-serif text-lg font-bold">PayU card payment</h2>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li>1. Tap the WhatsApp button below to send your order.</li>
                <li>
                  2. We reply with a secure PayU link for{" "}
                  <strong className="text-foreground">{formatRwf(total)}</strong> (ref {orderRef}).
                </li>
                <li>3. Pay by card and screenshot the PayU success page.</li>
              </ol>
            </div>
          )}

          <div className="rounded-2xl bg-muted p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">Your order</h2>
            <div className="space-y-2 text-sm">
              {selected.map((l) => (
                <div key={l.item.id} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{l.item.name} × {l.qty}</span>
                  <span className="font-medium">{formatRwf(l.item.price * l.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span>{formatRwf(DELIVERY_FEE)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <span>Total</span>
                <span>{formatRwf(total)}</span>
              </div>
            </div>
            <div className="mt-4 space-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
              <p><strong className="text-foreground">{name}</strong> · {phone}</p>
              <p>{address}{district ? `, ${district}` : ""}</p>
              {notes && <p>Notes: {notes}</p>}
            </div>
          </div>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-4 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition-transform active:scale-[0.98]"
          >
            <WhatsAppIcon className="size-5" />
            Send order & screenshot
          </a>

          <p className="flex items-start gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 flex-none text-primary" />
            After tapping, attach your payment screenshot in the WhatsApp chat. We confirm
            delivery within minutes — Nyarugenge, Kigali · Open 24 hours.
          </p>

          <button
            type="button"
            onClick={() => setOrderRef("")}
            className="w-full text-center text-xs font-semibold text-muted-foreground underline"
          >
            Edit my order
          </button>

          <a href={WHATSAPP_URL} className="sr-only">
            Chat with Beautècosmetics Rwanda
          </a>
        </div>
      )}
    </div>
  );
}
