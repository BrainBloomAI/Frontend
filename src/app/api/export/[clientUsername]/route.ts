import { exportClientData } from "@/app/actions";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: { clientUsername: string } }
) {
	let exportedData = await exportClientData(params.clientUsername)

	return NextResponse.json({success: true, content: exportedData})
}