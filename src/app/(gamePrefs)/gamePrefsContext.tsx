"use client"

import { createContext, Dispatch, ReactNode, SetStateAction, useEffect, useState } from "react"
import { GamePreferences } from "@/app/lib/definitions"

export const GamePrefContext = createContext<{prefs: GamePreferences, setPrefs?: Dispatch<SetStateAction<GamePreferences>>}>({
	prefs: {
		lang: 1
	}
})

export default function GamePrefContextProvider({ children }: { children: React.ReactNode }) {
	const [prefs, setPrefs] = useState({lang: 0 as 0|1|2|3|4})
	useEffect(() => {
		const getPrefs = () => {
			let rawPrefs = window.localStorage.getItem("prefs")
			if (rawPrefs) {
				return JSON.parse(rawPrefs)
			} else {
				return {
					lang: 1 as 0|1|2|3|4
				}
			}
		}

		let currentPrefs = getPrefs()
		if (currentPrefs.lang === prefs.lang) {
			// same
			return
		} else {
			setPrefs(currentPrefs)
		}
	}, [])

	useEffect(() => {
		localStorage.setItem("prefs", JSON.stringify(prefs))
		console.log("FIRED change", prefs)
	}, [prefs])

	return (
		<GamePrefContext.Provider value={{ prefs, setPrefs }}>
			{children}
		</GamePrefContext.Provider>
	)
}