"use client"

import { createContext, ReactNode, useEffect, useState } from "react"
import { GamePreferences } from "@/app/lib/definitions"

export const GamePrefContext = createContext<{prefs: GamePreferences}>({
	prefs: {
		lang: 1
	}
})

export default function GamePrefContextProvider({ children }: { children: React.ReactNode }) {
	const [prefs, setPrefs] = useState({lang: 1 as 1})
	useEffect(() => {
		const getPrefs = () => {
			let rawPrefs = window.localStorage.getItem("prefs")
			if (rawPrefs) {
				return JSON.parse(rawPrefs)
			} else {
				return {
					lang: 1 as 1
				}
			}
		}

		setPrefs(getPrefs())
	}, [])

	return (
		<GamePrefContext.Provider value={{ prefs }}>
			{children}
		</GamePrefContext.Provider>
	)
}