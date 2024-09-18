import { abandonGame } from "@/app/actions"

export async function GET() {
	await abandonGame()
	redirect("/games")
}