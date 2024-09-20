"use client"

import { ExtProfileData } from "@/app/lib/definitions"
import { createContext, Dispatch, SetStateAction, useState } from "react"

export const ClientDataContext = createContext<{ clientData?: ExtProfileData, setClientData?: Dispatch<SetStateAction<ExtProfileData>> }>({})

export function ClientDataProvider({ children, clientDataFromServer }: { children: React.ReactNode, clientDataFromServer: ExtProfileData }) {
	const [clientData, setClientData] = useState<ExtProfileData>(clientDataFromServer)

	return (
		<ClientDataContext.Provider value={{clientData, setClientData}}>
			{children}
		</ClientDataContext.Provider>
	)
}