"use client"

import GameInterface from "@/app/(gamePrefs)/(games)/games/[gamesId]/gameInterface"
import { useContext, useEffect, useState } from "react"
import { GamePrefContext } from "@/app/(gamePrefs)/gamePrefsContext"

export default function GameContainer({ params }: { params: { gamesId: string }}) {
	const { prefs, setPrefs } = useContext(GamePrefContext)

	return (
		<GameInterface gamesId={params.gamesId} prefs={prefs} />
	)
}

