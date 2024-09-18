import { abandonGame } from "@/app/actions"
import { redirect } from "next/navigation"

export async function GET() {
	await abandonGame()
	redirect("/games")
}