"use client"

import asset_01 from "@/public/games/asset_01.png"
import icon_mic from "@/public/icons/microphone.svg"

import { StaticImageData } from "next/image"

interface GameData {
	gameId: string,
	title: string,
	category: string,
	dialogues: Array<[string, 0|1, number, number]>,
	visualise: StaticImageData // TODO: switch to string (uri for image)
}

function getData(gameId: string): GameData {
	/**
	 * invokes GET /game/:gameId/info and returns the payload if successful, otherwise returns an error
	 */
	return {
		gameId: "4d1f",
		title: "Scenario 1",
		category: "Retail",
		visualise: asset_01,
		dialogues: [
			["Hello", 0, 0, 0],
			["Welcome", 0, 0.34, 2.4]
		]
	}
}

const activeDialogueInFocus = "font-bold text-2xl text-white"
const activeDialogueOutOfFocus = "font-bold text-xl text-slate-200"

export default function Game() {
	const gameData = getData("4d1f")

	return (
		<main className="bg-gray-900 text-white flex flex-col h-svh">
			<div className="flex flex-col items-center p-3">
				<h1 className="font-bold text-xl">{gameData.title}</h1>
				<p>[{gameData.category}]</p>
			</div>
			<div id="world-mapper" className="grow w-full min-h-0">
				<img src={gameData.visualise.src} className="w-full h-full object-cover" />
			</div>
			<div className="grow flex flex-col p-3 gap-5">
				<p className={`text-slate-300 text-lg font-bold text-center`}>[Customer walks up to your cashier with items to check out]</p>
				<div id="mic-indicator" className="hidden flex flex-col items-center p-2">
					<p className={`${activeDialogueInFocus}`}>Please speak</p>
					<div className="w-full grow min-h-0 p-4">
						<img src={icon_mic.src} className="p-6 mx-auto object-fit bg-white rounded-full" />
					</div>
				</div>
				<div id="speaking-indicator" className="group flex flex-row items-center gap-3 py-4 a [&.a]:justify-start [&.b]:justify-end-reverse">
					<div id="speaker-indicator" className="animate-pulse basis-1 h-full shrink-0 grow-0 bg-party-a"></div>
					<p className={`${activeDialogueInFocus}`}>It was lovely, thank you for asking</p>
				</div>
			</div>
		</main>
	)
}