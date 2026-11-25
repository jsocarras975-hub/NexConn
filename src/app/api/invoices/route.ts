import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
// Per-line cap matches the product price cap; the total cap matches Stripe's
// supported range (the invoice checkout route rejects totals over 99,999,999).
const MAX_UNIT_PRICE_CENTS = 99999999;
const MAX_TOTAL_CENTS = 99999999;
const createSchema=z.object({userId:z.string().min(1),projectId:z.string().optional(),currency:z.string().length(3).default("usd"),dueAt:z.string().datetime().optional(),notes:z.string().max(3000).optional(),items:z.array(z.object({description:z.string().trim().min(2).max(200),quantity:z.number().int().min(1).max(100),unitPriceCents:z.number().int().min(0).max(MAX_UNIT_PRICE_CENTS)})).min(1).max(50)});
export async function GET(){const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});const invoices=await prisma.invoice.findMany({where:["OWNER","ADMIN"].includes(user.role)?{}:{userId:user.id},orderBy:{createdAt:"desc"},include:{user:{select:{name:true,email:true}},items:true,project:{select:{title:true}}},take:200});return NextResponse.json({invoices});}
export async function POST(req:Request){const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});if(!["OWNER","ADMIN"].includes(user.role))return NextResponse.json({error:"Forbidden"},{status:403});
 const limit = await enforceRateLimit(req, { name: "invoice-create", limit: 20, windowSeconds: 60 * 60 });
 if (!limit.allowed) return NextResponse.json({ error: "Too many invoices. Please try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
 const parsed=createSchema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Invalid invoice details."},{status:400});const d=parsed.data;const subtotalCents=d.items.reduce((s,i)=>s+i.quantity*i.unitPriceCents,0);
 if (subtotalCents < 1 || subtotalCents > MAX_TOTAL_CENTS) return NextResponse.json({ error: "Invoice total is outside Stripe's supported range." }, { status: 400 });
 const invoiceNumber=`NX-${new Date().getFullYear()}-${randomUUID().slice(0,8).toUpperCase()}`;try{if(d.projectId){const project=await prisma.project.findFirst({where:{id:d.projectId,clientId:d.userId},select:{id:true}});if(!project)return NextResponse.json({error:"The selected project does not belong to this customer."},{status:400});}
 const invoice=await prisma.invoice.create({data:{invoiceNumber,userId:d.userId,projectId:d.projectId,currency:d.currency.toLowerCase(),subtotalCents,totalCents:subtotalCents,dueAt:d.dueAt?new Date(d.dueAt):undefined,notes:d.notes,status:"DRAFT",items:{create:d.items}}});await prisma.auditLog.create({data:{actorId:user.id,action:"INVOICE_CREATED",target:invoice.id}});return NextResponse.json({invoice},{status:201});}catch{return NextResponse.json({error:"Unable to create invoice. Check customer and project."},{status:400});}}
