import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inquirySchema } from "@/lib/validators";
import { sendEmail } from "@/lib/email";
export async function POST(req:Request){try{const parsed=inquirySchema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:"Please complete the required fields correctly."},{status:400});await prisma.inquiry.create({data:parsed.data});
    if(process.env.OWNER_EMAIL){const safeName=parsed.data.name.replace(/[&<>"]/g,"");const safeService=parsed.data.service.replace(/[&<>"]/g,"");void sendEmail({to:process.env.OWNER_EMAIL,subject:`New NEXCON inquiry: ${safeService}`,html:`<p>New project inquiry from ${safeName} (${parsed.data.email}).</p><p>Service: ${safeService}</p><p>${parsed.data.details.replace(/[&<>"]/g,"")}</p>`});}
    return NextResponse.json({ok:true},{status:201});}catch{return NextResponse.json({error:"We couldn't save your inquiry. Please try again."},{status:500});}}
