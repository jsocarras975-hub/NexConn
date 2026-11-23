"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import type { CartItem } from "@/lib/cart";

const KEY = "nexcon_cart_v1";
const format = (cents:number,currency:string) => new Intl.NumberFormat("en-US",{style:"currency",currency:currency.toUpperCase()}).format(cents/100);

export function CartPage() {
  const [items,setItems] = useState<CartItem[]>([]);
  const [ready,setReady] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY)||"[]")); } catch { setItems([]); }
    setReady(true);
    const refresh=()=>{try{setItems(JSON.parse(localStorage.getItem(KEY)||"[]"));}catch{setItems([]);}};
    window.addEventListener("nexcon-cart-updated",refresh);
    window.addEventListener("storage",refresh);
    return ()=>{window.removeEventListener("nexcon-cart-updated",refresh);window.removeEventListener("storage",refresh);};
  }, []);

  function save(next:CartItem[]) { setItems(next); localStorage.setItem(KEY,JSON.stringify(next)); window.dispatchEvent(new Event("nexcon-cart-updated")); }
  const total = useMemo(()=>items.reduce((sum,item)=>sum+item.priceCents*item.quantity,0),[items]);
  const currency = items[0]?.currency || "usd";
  const mixed = items.some(item=>item.currency.toLowerCase()!==currency.toLowerCase());

  async function checkout() {
    setBusy(true);setError("");
    try {
      const response=await fetch("/api/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:items.map(item=>({productId:item.productId,quantity:item.quantity}))})});
      const data=await response.json();
      if(response.status===401){window.location.assign("/login?next=/cart");return;}
      if(!response.ok)throw new Error(data.error||"Checkout could not be started.");
      if(!data.url)throw new Error("Payment provider did not return a checkout URL.");
      window.location.assign(data.url);
    } catch(err) {setError(err instanceof Error?err.message:"Checkout failed.");setBusy(false);}
  }

  if(!ready)return <div className="card p-8 text-sm text-slate-400">Loading your cart…</div>;
  if(!items.length)return <div className="card px-6 py-14 text-center"><ShoppingBag className="mx-auto text-cyan-300" size={34}/><h2 className="mt-5 text-xl font-semibold">Your cart is taking a breather.</h2><p className="mt-2 text-sm text-slate-400">Browse the marketplace and add something useful.</p><Link href="/marketplace" className="btn-primary mt-6">Explore marketplace</Link></div>;

  return <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
    <div className="space-y-3">{items.map(item=><article key={item.productId} className="card flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="min-w-[180px] flex-1"><p className="font-semibold">{item.name}</p><p className="mt-1 text-sm text-slate-400">{format(item.priceCents,item.currency)} each</p></div>
      <div className="flex items-center gap-2"><button aria-label={`Decrease ${item.name} quantity`} onClick={()=>save(items.map(x=>x.productId===item.productId?{...x,quantity:Math.max(1,x.quantity-1)}:x))} className="rounded-lg border border-white/10 p-2"><Minus size={14}/></button><span className="w-6 text-center text-sm tabular-nums">{item.quantity}</span><button aria-label={`Increase ${item.name} quantity`} onClick={()=>save(items.map(x=>x.productId===item.productId?{...x,quantity:Math.min(10,x.quantity+1)}:x))} className="rounded-lg border border-white/10 p-2"><Plus size={14}/></button><button aria-label={`Remove ${item.name}`} onClick={()=>save(items.filter(x=>x.productId!==item.productId))} className="ml-2 rounded-lg border border-rose-400/20 p-2 text-rose-300"><Trash2 size={14}/></button></div>
      <p className="w-full text-right text-sm font-semibold">{format(item.priceCents*item.quantity,item.currency)}</p>
    </article>)}</div>
    <aside className="card h-fit p-6"><h2 className="text-lg font-semibold">Order summary</h2><div className="mt-5 flex justify-between text-sm text-slate-400"><span>Subtotal</span><span>{format(total,currency)}</span></div><div className="mt-3 flex justify-between text-sm text-slate-400"><span>Tax</span><span>Calculated at checkout</span></div><div className="my-5 border-t border-white/10"/><div className="flex justify-between font-semibold"><span>Total before tax</span><span>{format(total,currency)}</span></div>
      {mixed?<p className="mt-4 text-xs text-amber-300">Separate carts are needed for products in different currencies.</p>:<button disabled={busy} onClick={checkout} className="btn-primary mt-6 w-full disabled:opacity-50">{busy?"Preparing checkout…":"Continue to secure checkout"}</button>}
      {error&&<p role="alert" className="mt-3 text-xs text-rose-300">{error}</p>}<p className="mt-4 text-xs leading-5 text-slate-500">Prices are loaded again and verified on the server before checkout. Payment is processed by Stripe.</p>
    </aside>
  </div>;
}
