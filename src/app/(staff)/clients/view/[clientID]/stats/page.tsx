"use server"

import { useContext } from "react"
import { getClientData } from "@/app/actions"
import { redirect } from "next/navigation"

import { StatsContainer } from "@/app/lib/ui/statsContainer"

const GAME_STATUS_COLOR = {
	"ongoing": "#ff8f38",
	"complete": "#43c141",
	"abandoned": "#ff0000"
}

export default async function AccountPage({ params }: { params: { clientID: string }}) {
	const payload = await getClientData(params.clientID)
	if (!payload.success) {
		return redirect("/clients/view")
	}

	const clientData = payload.data!

	return (
		<div className="p-8 flex flex-col h-svh">
			<div className="flex flex-row gap-2">
				<a href="/clients/view" className="text-2xl font-bold">&lt;</a>
				<h1 className="text-2xl pb-4 font-bold text-black">{`${clientData.username}'s statistics`}</h1>
			</div>				
			<StatsContainer clientData={clientData} showOnboardBtn={true} />
		</div>
	)
}