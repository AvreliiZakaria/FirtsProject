import { NextResponse } from "next/server";
import { deleteGeneration } from "@/lib/db";
export const runtime="nodejs";
export async function DELETE(request:Request){let body:{id?:number};try{body=await request.json();}catch{return NextResponse.json({success:false,error:"Неверный формат запроса."},{status:400});}if(!Number.isInteger(body.id)||!body.id)return NextResponse.json({success:false,error:"Не указан id."},{status:400});const ok=await deleteGeneration(body.id);return NextResponse.json(ok?{success:true}:{success:false,error:"Не удалось удалить."},{status:ok?200:500});}
