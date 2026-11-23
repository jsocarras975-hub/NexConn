import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});if(!["OWNER","ADMIN"].includes(user.role))return NextResponse.json({error:"Forbidden"},{status:403});
 const {id}=await params;const tasks=await prisma.projectTask.findMany({where:{projectId:id},orderBy:[{sortOrder:"asc"},{createdAt:"asc"}]});return NextResponse.json({tasks});
}
