"use client"

import { redirect } from "next/navigation"
import GameInterface from "@/app/(games)/games/[gamesId]/gameInterface"
import { getGameData } from "@/app/actions"
import { useEffect, useState } from "react"

export default function GameContainer({ params }: { params: { gamesId: string }}) {
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
		<GameInterface gamesId={params.gamesId} prefs={prefs} />
	)
}

