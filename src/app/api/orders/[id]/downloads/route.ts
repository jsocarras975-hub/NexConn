import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPrivateDownloadUrl } from "@/lib/storage";

export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await getCurrentUser();
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const order=await prisma.order.findFirst({
    where:{id,userId:user.id,status:{in:["PAID","FULFILLED"]}},
    include:{items:{include:{product:{select:{id:true,name:true,downloadKey:true}}}}}
  });
  if(!order)return NextResponse.json({error:"Paid order not found."},{status:404});
  try{
    const downloads=await Promise.all(order.items.filter(i=>i.product.downloadKey).map(async item=>({
      productId:item.product.id,
      productName:item.product.name,
      url:await createPrivateDownloadUrl(item.product.downloadKey!)
    })));
    if(!downloads.length)return NextResponse.json({error:"No downloadable files have been attached to this order yet."},{status:404});
    return NextResponse.json({downloads,expiresInSeconds:300});
  }catch{
    return NextResponse.json({error:"Secure download service is not configured."},{status:503});
  }
}
