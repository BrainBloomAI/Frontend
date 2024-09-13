import { getClientData } from "@/app/actions"
import { redirect } from "next/navigation"
import { GameCardContainer } from "@/app/lib/ui/gameCardContainer"

export default async function ClientDetailPage({ params }: { params: { clientID: string }}) {
	const payload = await getClientData(params.clientID)
	if (!payload.success) {
		return redirect("/clients/view")
	}

	const clientData = payload.data!

	return (
		<main className="p-8 flex flex-col">
			<div className="flex gap-3">
				<a href="/clients/view" className="font-bold text-2xl">&lt;</a>
				<h1 className="font-bold text-2xl">Client: {clientData.username}</h1>
			</div>

			<h1 className="text-2xl font-bold my-2 mt-4">Games played</h1>
			<GameCardContainer gameDataArray={clientData.games} />
		</main>
	)
}