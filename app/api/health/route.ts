import { NextResponse } from "next/server";
export function GET(){return NextResponse.json({status:"ok",service:"brobex-image-tools",processing:"browser-first",providerConfigured:Boolean(process.env.IMAGE_AI_PROVIDER&&process.env.IMAGE_AI_API_KEY)});}
