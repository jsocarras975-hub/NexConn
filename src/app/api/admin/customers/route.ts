import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET(){const u=await getCurrentUser();if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});if(!["OWNER","ADMIN"].includes(u.role))return NextResponse.json({error:"Forbidden"},{status:403});const customers=await prisma.user.findMany({where:{role:"CLIENT"},select:{id:true,name:true,email:true},orderBy:{name:"asc"},take:500});return NextResponse.json({customers});}
