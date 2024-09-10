"use server"

import { redirect } from "next/navigation"
import GameInterface from "@/app/(games)/games/[gamesId]/gameInterface"
import { getGameData } from "@/app/actions"

export default async function GameContainer({ params }: { params: { gamesId: string }}) {
	// get game data
	const gameData = getGameData(params.gamesId)
	if (gameData == null) {
		// not able to fetch game data
		return redirect("/games?_referred-by=1")
	}

	return (
		<GameInterface gamesId={params.gamesId} gameData={gameData} />
	)
}

