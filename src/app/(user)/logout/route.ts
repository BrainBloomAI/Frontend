"use server"

import { logout } from "@/app/actions"

export async function GET() {
	return logout()
}