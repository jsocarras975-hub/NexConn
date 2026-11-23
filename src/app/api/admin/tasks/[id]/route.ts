import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const schema=z.object({status:z.enum(["TODO","IN_PROGRESS","BLOCKED","DONE"]).optional(),title:z.string().trim().min(2).max(140).optional(),dueAt:z.string().datetime().nullable().optional()}).refine(v=>Object.keys(v).length>0);
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});if(!["OWNER","ADMIN"].includes(user.role))return NextResponse.json({error:"Forbidden"},{status:403});
 const parsed=schema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:"Invalid task update."},{status:400});const {id}=await params;
 try{const task=await prisma.projectTask.update({where:{id},data:{...parsed.data,dueAt:parsed.data.dueAt===undefined?undefined:parsed.data.dueAt===null?null:new Date(parsed.data.dueAt)}});await prisma.auditLog.create({data:{actorId:user.id,action:"PROJECT_TASK_UPDATED",target:id,metadata:parsed.data}});return NextResponse.json({task});}catch{return NextResponse.json({error:"Task not found."},{status:404});}
}
