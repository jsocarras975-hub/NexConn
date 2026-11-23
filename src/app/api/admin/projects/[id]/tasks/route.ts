import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const schema=z.object({title:z.string().trim().min(2).max(140),description:z.string().max(2000).optional(),dueAt:z.string().datetime().optional()});
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});if(!["OWNER","ADMIN"].includes(user.role))return NextResponse.json({error:"Forbidden"},{status:403});
 const {id}=await params;const parsed=schema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:"Invalid task details."},{status:400});
 const project=await prisma.project.findUnique({where:{id},select:{id:true}});if(!project)return NextResponse.json({error:"Project not found."},{status:404});
 const task=await prisma.projectTask.create({data:{projectId:id,title:parsed.data.title,description:parsed.data.description,dueAt:parsed.data.dueAt?new Date(parsed.data.dueAt):undefined}});
 await prisma.auditLog.create({data:{actorId:user.id,action:"PROJECT_TASK_CREATED",target:task.id}});
 return NextResponse.json({task},{status:201});
}
