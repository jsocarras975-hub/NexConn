import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
export async function POST(req:Request){try{const parsed=loginSchema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:"Invalid email or password."},{status:400});const {email,password}=parsed.data;const user=await prisma.user.findUnique({where:{email:email.toLowerCase()}});if(!user||user.disabled||!(await bcrypt.compare(password,user.passwordHash)))return NextResponse.json({error:"Invalid email or password."},{status:401});await createSession(user.id);return NextResponse.json({ok:true});}catch{return NextResponse.json({error:"Unable to sign in."},{status:500});}}
