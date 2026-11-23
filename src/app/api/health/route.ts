import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({status:"ok",service:"n3xus-konc3ptz-web",timestamp:new Date().toISOString()});}
