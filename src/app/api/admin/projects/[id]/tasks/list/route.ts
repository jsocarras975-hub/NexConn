import { NextResponse } from "next/server";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 const auth=await requireAdmin();if("error" in auth)return auth.error;const user=auth.user;
 const {id}=await params;const tasks=await prisma.projectTask.findMany({where:{projectId:id},orderBy:[{sortOrder:"asc"},{createdAt:"asc"}]});return NextResponse.json({tasks});
}
