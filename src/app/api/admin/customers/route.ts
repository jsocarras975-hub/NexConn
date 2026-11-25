import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET(){const auth=await requireAdmin();if("error" in auth)return auth.error;const customers=await prisma.user.findMany({where:{role:"CLIENT"},select:{id:true,name:true,email:true},orderBy:{name:"asc"},take:500});return NextResponse.json({customers});}
