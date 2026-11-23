import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";
export async function POST(req:Request){try{const parsed=registerSchema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:"Please check your details."},{status:400});const {name,email,password}=parsed.data;const normalized=email.toLowerCase();const exists=await prisma.user.findUnique({where:{email:normalized}});if(exists)return NextResponse.json({error:"An account with that email already exists."},{status:409});const user=await prisma.user.create({data:{name,email:normalized,passwordHash:await bcrypt.hash(password,12),role:"CLIENT"}});await createSession(user.id);return NextResponse.json({ok:true},{status:201});}catch{return NextResponse.json({error:"Unable to create account."},{status:500});}}
