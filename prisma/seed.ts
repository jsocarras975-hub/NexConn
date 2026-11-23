import { PrismaClient } from "@prisma/client";
const prisma=new PrismaClient();
async function main(){
 const products=[
  {slug:"discord-community-starter",name:"Discord Community Starter",summary:"A clean foundation for a feature-rich Discord community bot.",description:"Starter product placeholder. Add the exact included features, compatibility matrix, license terms, update policy, and delivery instructions before publishing.",category:"Bot templates",priceCents:4999,featured:true},
  {slug:"automation-blueprint",name:"Automation Blueprint Pack",summary:"Reusable workflow patterns for connected business operations.",description:"A collection of automation blueprints. Document each workflow, supported services, prerequisites, and maintenance requirements before publishing.",category:"Automation",priceCents:2999,featured:false},
  {slug:"client-portal-ui-kit",name:"Client Portal UI Kit",summary:"A polished starting point for customer-facing project workspaces.",description:"A UI kit placeholder. Include file formats, license scope, framework version, and support policy before publishing.",category:"Design systems",priceCents:3900,featured:false}
 ];
 for(const p of products)await prisma.product.upsert({where:{slug:p.slug},update:{},create:p});
 console.log("Seed products inserted.");
}
main().finally(()=>prisma.$disconnect());
