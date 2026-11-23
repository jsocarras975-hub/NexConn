import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const schema=z.object({
 name:z.string().trim().min(2).max(140).optional(),
 summary:z.string().trim().min(5).max(300).optional(),
 description:z.string().trim().min(10).max(10000).optional(),
 category:z.string().trim().min(2).max(80).optional(),
 priceCents:z.number().int().nonnegative().optional(),
 currency:z.string().length(3).optional(),
 downloadKey:z.string().max(500).nullable().optional(),
 active:z.boolean().optional(),
 featured:z.boolean().optional()
}).refine(v=>Object.keys(v).length>0);
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const u=await getCurrentUser();if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});if(!["OWNER","ADMIN"].includes(u.role))return NextResponse.json({error:"Forbidden"},{status:403});
 const p=schema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:"Invalid product update."},{status:400});const {id}=await params;
 try{const product=await prisma.product.update({where:{id},data:{...p.data,currency:p.data.currency?.toLowerCase()}});await prisma.auditLog.create({data:{actorId:u.id,action:"PRODUCT_UPDATED",target:id}});return NextResponse.json({product});}catch{return NextResponse.json({error:"Product not found."},{status:404});}
}
