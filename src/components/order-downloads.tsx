"use client";
import { useState } from "react";
import { Download } from "lucide-react";
export function OrderDownloads({orderId}:{orderId:string}){
 const [busy,setBusy]=useState(false);const [links,setLinks]=useState<{productName:string;url:string}[]>([]);const [error,setError]=useState("");
 async function load(){setBusy(true);setError("");setLinks([]);try{const r=await fetch(`/api/orders/${orderId}/downloads`);const d=await r.json();if(!r.ok)throw new Error(d.error||"Downloads unavailable.");setLinks(d.downloads);}catch(e){setError(e instanceof Error?e.message:"Download request failed.");}finally{setBusy(false);}}
 return <div className="mt-3"><button onClick={load} disabled={busy} className="inline-flex items-center gap-2 text-xs font-semibold text-violet-300 disabled:opacity-50"><Download size={14}/>{busy?"Preparing links…":"Get downloads"}</button>{links.map((l,i)=><a key={i} href={l.url} className="ml-4 text-xs text-cyan-300 underline" target="_blank" rel="noreferrer">{l.productName}</a>)}{error&&<p role="status" className="mt-2 text-xs text-amber-300">{error}</p>}<p className="mt-1 text-[10px] text-slate-600">Download links expire after five minutes.</p></div>;
}
