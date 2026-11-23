import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const schema=z.object({body:z.string().trim().min(1).max(4000)});
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const {id}=await params;const parsed=schema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:"Message cannot be empty."},{status:400});
 const ticket=await prisma.ticket.findUnique({where:{id},select:{id:true,userId:true,status:true}});
 if(!ticket)return NextResponse.json({error:"Ticket not found."},{status:404});
 const isOwner=["OWNER","ADMIN"].includes(user.role);if(!isOwner&&ticket.userId!==user.id)return NextResponse.json({error:"Forbidden"},{status:403});
 if(ticket.status==="CLOSED"||ticket.status==="RESOLVED")return NextResponse.json({error:"This ticket is closed."},{status:409});
 const message=await prisma.message.create({data:{ticketId:id,authorId:user.id,body:parsed.data.body}});
 await prisma.ticket.update({where:{id},data:{status:isOwner?"WAITING":"IN_PROGRESS"}});
 return NextResponse.json({message},{status:201});
}
