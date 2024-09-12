"use server"

import { abandonGame } from "@/app/actions"
import Alerts from "@/app/lib/ui/alerts";

export default async function AbandonPage() {
	let errorMessage: undefined|string;
	let payload = await abandonGame()
	if (!payload.success) {
		errorMessage = payload.message
	}

	return (
		<div className="h-svh p-8">
			<Alerts message={errorMessage} />
		</div>
	)
}