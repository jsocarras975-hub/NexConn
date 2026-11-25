import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const allowed=["maintenance_notice","support_email"] as const;
const schema=z.object({key:z.enum(allowed),value:z.string().max(1000)});
async function authorize(){const auth=await requireAdmin();return "user" in auth?auth.user:null;}
export async function GET(){if(!await authorize())return NextResponse.json({error:"Forbidden"},{status:403});const settings=await prisma.businessSetting.findMany({where:{key:{in:[...allowed]}}});return NextResponse.json({settings});}
export async function PUT(req:Request){const user=await authorize();if(!user)return NextResponse.json({error:"Forbidden"},{status:403});const p=schema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:"Invalid setting."},{status:400});const setting=await prisma.businessSetting.upsert({where:{key:p.data.key},create:p.data,update:{value:p.data.value}});await prisma.auditLog.create({data:{actorId:user.id,action:"BUSINESS_SETTING_UPDATED",target:p.data.key}});return NextResponse.json({setting});}
