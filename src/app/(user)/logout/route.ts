"use server"

import { logout } from "@/app/actions"
import { redirect } from "next/navigation"

export async function GET() {
	let payload = await logout()

	return redirect("/login")
}