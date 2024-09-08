"use client"

import asset_01 from "@/public/games/asset_01.png"
import icon_mic from "@/public/icons/microphone.svg"

import { StaticImageData } from "next/image"
import { Game, GameData, SPEAKER_ID } from "@/app/lib/controllers/game"
import { redirect } from "next/navigation"
import { RefObject, useEffect, useRef, useState } from "react"
import { Console } from "console"

const activeDialogueInFocus = "font-bold text-2xl text-white"
const activeDialogueOutOfFocus = "font-bold text-xl text-slate-200"

const typeText = (text: string, ref: RefObject<HTMLParagraphElement>) => {
	console.log("<C>", ref, text)
	if (!ref.current) {
		return
	}

	// clear contents
	ref.current.innerHTML = ""

	let charPointer = 0
	let intervalId: NodeJS.Timeout;
	intervalId = setInterval(() => {
		if (!ref.current) {
			return clearTimeout(intervalId)
		}

		ref.current.innerHTML += text[charPointer++]
		console.log(charPointer)
		if (charPointer >= text.length) {
			return clearTimeout(intervalId)
		}
	}, 50)
}

export default function GameInterface({ gamesId }: { gamesId: string }) {
	const gameController = new Game()

	const speakerIndicatorRef = useRef<HTMLDivElement>(null)
	const typingContainerRef = useRef<HTMLParagraphElement>(null)

	const [gameData, setGameData] = useState<GameData>()

	useEffect(() => {
		gameController.dialogueNextEvent = (dialogueEntry) => {
			if (!speakerIndicatorRef.current) {
				return
			}

			// set speaker indicator
			console.log("<A>", dialogueEntry)
			const isSystem = dialogueEntry.speaker === SPEAKER_ID.System
			const isUser = dialogueEntry.speaker === SPEAKER_ID.User
			speakerIndicatorRef.current.classList.toggle("a", isSystem)
			speakerIndicatorRef.current.classList.toggle("b", isUser) // third state is when neither a nor b is present (middle)
		}

		gameController.dialogueAttemptNextEvent = (dialogueEntry, attemptEntry) => {
			console.log("<B>", dialogueEntry, attemptEntry)
			if (dialogueEntry.speaker === SPEAKER_ID.System) {
				typeText(attemptEntry.content, typingContainerRef)
			}
		}

		if (!gameController.ready) {
			// not yet registered
			gameController.register(gamesId) // only register after attaching all the event listeners
			if (!gameController.ready) {
				// failed to load game object -> unable to render game, send back home page
				return redirect("/")
			}

			setGameData(gameController.data)
		}
	}, [speakerIndicatorRef, typingContainerRef])

	return (
		<main className="bg-gray-900 text-white flex flex-col h-svh">
			<div className="flex flex-col items-center p-3">
				<h1 className="font-bold text-xl">{gameData?.title}</h1>
				<p>[{gameData?.scenario}]</p>
			</div>
			<div id="world-mapper" className="grow w-full min-h-0">
				<img src={gameData?.visualise.src} className="w-full h-full object-cover" />
			</div>
			<div className="grow flex flex-col p-3 gap-5">
				<p className={`text-slate-300 text-lg font-bold text-center`}>[Customer walks up to your cashier with items to check out]</p>
				<div id="mic-indicator" className="hidden flex flex-col items-center p-2">
					<p className={`${activeDialogueInFocus}`}>Please speak</p>
					<div className="w-full grow min-h-0 p-4">
						<img src={icon_mic.src} className="p-6 mx-auto object-fit bg-white rounded-full" />
					</div>
				</div>
				<div ref={speakerIndicatorRef} id="speaking-indicator" className="group flex flex-row items-center gap-3 py-4 a justify-center [&.a]:justify-start [&.b]:justify-end-reverse">
					<div id="speaker-indicator" className="animate-pulse basis-1 h-full shrink-0 grow-0 group-[.a]:bg-party-a group-[.b]:bg-party-b"></div>
					<p ref={typingContainerRef} className={`${activeDialogueInFocus}`}></p>
				</div>
			</div>
		</main>
	)
}