import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const schema=z.object({status:z.enum(["INQUIRY","QUOTED","ACTIVE","REVIEW","COMPLETED","ON_HOLD"]).optional(),progress:z.number().int().min(0).max(100).optional(),dueAt:z.string().datetime().nullable().optional()}).refine(v=>Object.keys(v).length>0);
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){const auth=await requireAdmin();if("error" in auth)return auth.error;const user=auth.user;const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Invalid project update."},{status:400});const {id}=await params;try{const project=await prisma.project.update({where:{id},data:{...parsed.data,dueAt:parsed.data.dueAt===undefined?undefined:parsed.data.dueAt===null?null:new Date(parsed.data.dueAt)}});await prisma.auditLog.create({data:{actorId:user.id,action:"PROJECT_UPDATED",target:id,metadata:parsed.data}});return NextResponse.json({project});}catch{return NextResponse.json({error:"Project not found or update failed."},{status:404});}}
