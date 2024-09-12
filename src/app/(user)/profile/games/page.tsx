"use client"

import { useContext } from "react"
import { ProfileDataContext } from "@/app/(user)/contextWrapper"

const GAME_STATUS_COLOR = {
	"ongoing": "#ff8f38",
	"complete": "#43c141",
	"abandoned": "#ff0000"
}

export default function AccountPage() {
	const { profileData } = useContext(ProfileDataContext)

	return (
		<div className="p-8 flex flex-col h-svh">
			<div className="flex flex-row gap-2">
				<a href="/profile" className="text-2xl font-bold">&lt;</a>
				<h1 className="text-2xl pb-4 font-bold text-black">My games</h1>
			</div>
			<div className="flex flex-col gap-3">
			{
				profileData.games.map((gameData, i) => {
					return (
						<div key={i} className="rounded p-3 bg-white border border-black border-solid">
							<div className="flex justify-between">
								<p className="rounded p-2 bg-black text-white">{gameData.scenario?.name}</p>
								<p className={`grow text-right font-bold`} style={{color: GAME_STATUS_COLOR[gameData.status]}}>{gameData.status.toUpperCase()}</p>
							</div>
							<div className="flex flex-row gap-2 mt-4">
								<div className="flex flex-col">
									<p>{new Date(gameData.startedTimestamp).toLocaleString("en-SG")}</p>
									<p className="text-sm text-[#555555]">#{gameData.gameID}</p>
								</div>
								<a href={`/games/${gameData.gameID}`} className="rounded p-2 px-4 bg-black text-white font-bold self-end">Go</a>
							</div>
						</div>
					)
				})
			}
			</div>
		</div>
	)
}