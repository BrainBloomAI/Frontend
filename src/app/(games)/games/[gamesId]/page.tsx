"use client"

import { Game, SPEAKER_ID } from "@/app/lib/controllers/game"

import asset_01 from "@/public/games/asset_01.png"
import icon_mic from "@/public/icons/microphone.svg"

import { StaticImageData } from "next/image"
import { redirect } from "next/navigation"
import { createContext, RefObject, useRef } from "react"
import GameInterface from "@/app/(games)/games/[gamesId]/gameScreen"


type GameContext = {
	speakerIndicatorRef?: RefObject<HTMLDivElement>,
	typingContainerRef?: RefObject<HTMLParagraphElement>
}

const GameContext = createContext<GameContext>({})

export default function GamePage({ params }: { params: { gamesId: string }}) {
	const speakerIndicatorRef = useRef<HTMLDivElement>(null)
	const typingContainerRef = useRef<HTMLParagraphElement>(null)

	return (
		<GameContext.Provider value={{ speakerIndicatorRef, typingContainerRef }}>
			<GameInterface gamesId={params.gamesId} />
		</GameContext.Provider>
	)
}

