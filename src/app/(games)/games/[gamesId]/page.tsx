"use server"

import { redirect } from "next/navigation"
import GameInterface from "@/app/(games)/games/[gamesId]/gameInterface"
import { getGameData } from "@/app/actions"

export default async function GameContainer({ params }: { params: { gamesId: string }}) {
	return (
		<GameInterface gamesId={params.gamesId} />
	)
}

