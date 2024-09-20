"use server"

import { getClientData } from "@/app/actions"
import { redirect } from "next/navigation"
import { ClientDataProvider } from "@/app/(staff)/clients/view/[clientID]/clientDataProvider"

export default async function ClientViewLayout({ children, params }: { children: React.ReactNode, params: { clientID: string } }) {
	const payload = await getClientData(params.clientID)
	if (!payload.success) {
		return redirect("/clients/view")
	}

	const clientData = payload.data!

	return (
		<ClientDataProvider clientDataFromServer={clientData} children={children} />
	)
}