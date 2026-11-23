import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
const prisma=new PrismaClient();
async function main(){
 const name=process.env.OWNER_NAME?.trim();
 const email=process.env.OWNER_EMAIL?.trim().toLowerCase();
 const password=process.env.OWNER_PASSWORD;
 if(!name||!email||!password||password.length<16)throw new Error("Set OWNER_NAME, OWNER_EMAIL, and OWNER_PASSWORD (at least 16 characters) in your shell environment.");
 const existing=await prisma.user.findUnique({where:{email}});
 if(existing){if(existing.role==="OWNER"||existing.role==="ADMIN")throw new Error("That owner account already exists.");throw new Error("That email is already registered as a client. Use a different email or promote it manually after verifying identity.");}
 const user=await prisma.user.create({data:{name,email,passwordHash:await bcrypt.hash(password,12),role:"OWNER"}});
 console.log(`Owner account created: ${user.email}`);
}
main().catch(e=>{console.error(e.message);process.exit(1)}).finally(()=>prisma.$disconnect());
