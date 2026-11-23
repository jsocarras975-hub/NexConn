import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema=z.object({subject:z.string().trim().min(4).max(140),message:z.string().trim().min(10).max(4000),priority:z.enum(["LOW","NORMAL","HIGH","URGENT"]).default("NORMAL")});

export async function GET(){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const where=["OWNER","ADMIN"].includes(user.role)?{}:{userId:user.id};
 const tickets=await prisma.ticket.findMany({where,orderBy:{updatedAt:"desc"},include:{user:{select:{id:true,name:true,email:true}},messages:{orderBy:{createdAt:"asc"},include:{author:{select:{id:true,name:true,role:true}}}}},take:100});
 return NextResponse.json({tickets});
}
export async function POST(req:Request){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const parsed=createSchema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:"Check the ticket details."},{status:400});
 try{
  const ticket=await prisma.ticket.create({data:{userId:user.id,subject:parsed.data.subject,priority:parsed.data.priority,messages:{create:{authorId:user.id,body:parsed.data.message}}},include:{messages:true}});
  return NextResponse.json({ticket},{status:201});
 }catch{return NextResponse.json({error:"Unable to create support ticket."},{status:500});}
}
