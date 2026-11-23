import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const schema=z.object({
 slug:z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
 name:z.string().trim().min(2).max(140),
 summary:z.string().trim().min(5).max(300),
 description:z.string().trim().min(10).max(10000),
 category:z.string().trim().min(2).max(80),
 priceCents:z.number().int().nonnegative(),
 currency:z.string().length(3).default("usd"),
 downloadKey:z.string().max(500).optional(),
 active:z.boolean().default(false),
 featured:z.boolean().default(false)
});
async function owner(){const u=await getCurrentUser();return u&&["OWNER","ADMIN"].includes(u.role)?u:null;}
export async function GET(){if(!await owner())return NextResponse.json({error:"Forbidden"},{status:403});const products=await prisma.product.findMany({orderBy:{createdAt:"desc"}});return NextResponse.json({products});}
export async function POST(req:Request){const u=await owner();if(!u)return NextResponse.json({error:"Forbidden"},{status:403});const p=schema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:"Invalid product details."},{status:400});try{const product=await prisma.product.create({data:{...p.data,currency:p.data.currency.toLowerCase()}});await prisma.auditLog.create({data:{actorId:u.id,action:"PRODUCT_CREATED",target:product.id}});return NextResponse.json({product},{status:201});}catch{return NextResponse.json({error:"Product slug may already exist."},{status:409});}}
