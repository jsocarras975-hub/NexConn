"use client";
import { useState } from "react";
import { SectionHeading } from "@/components/section-heading";
export default function Lab(){const [mode,setMode]=useState("automation");return <main className="container section"><SectionHeading eyebrow="NEXCON Lab" title="Explore ideas in motion." description="An interactive concept playground for showing how connected systems can work. These are local demonstrations, not live customer systems."/><div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><div className="card p-6"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Choose a demo</p>{[["automation","Workflow engine"],["community","Community bot"],["commerce","Commerce logic"]].map(([id,label])=><button key={id} onClick={()=>setMode(id)} className={`mt-3 w-full rounded-xl border p-4 text-left text-sm ${mode===id?"border-violet-300/50 bg-violet-400/10 text-white":"border-white/10 text-slate-400"}`}>{label}</button>)}</div><div className="card min-h-[300px] p-7"><p className="eyebrow">Interactive sandbox</p><h2 className="mt-3 text-2xl font-semibold">{mode==="automation"?"Workflow engine":mode==="community"?"Community bot":"Commerce logic"}</h2><p className="mt-3 max-w-lg text-sm leading-7 text-slate-400">{mode==="automation"?"Model a trigger, apply business rules, and route a task to the right destination.":mode==="community"?"Preview a community command flow with configurable responses and moderation logic.":"Explore product, cart, and order-state concepts without processing real payments."}</p><div className="mt-8 rounded-xl border border-white/10 bg-[#090e17] p-5 font-mono text-xs leading-7 text-emerald-200">{mode==="automation"?"> event.received\
> validate_payload()\
> apply_rules()\
> route_to_queue()\
> status: ready":mode==="community"?"> /help\
> /profile\
> /support create\
> moderation: enabled\
> status: ready":"> product.selected\
> cart.validate()\
> checkout.preview()\
> payment: disabled\
> status: sandbox"}</div></div></div></main>}
