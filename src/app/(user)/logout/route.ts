"use server"

import { logout } from "@/app/actions"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
	let payload = await logout()

	console.log("REQ", request.url)
	return NextResponse.redirect(new URL("/login", request.url)) // redirect regardless TODO: fix this behavior
}