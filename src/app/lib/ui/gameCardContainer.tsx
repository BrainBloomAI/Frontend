import { GameData } from "@/app/lib/definitions"

const GAME_STATUS_COLOR = {
	"ongoing": "#ff8f38",
	"complete": "#43c141",
	"abandoned": "#ff0000"
}

export function GameCardContainer({ gameDataArray }: { gameDataArray: Array<GameData> }) {
	return (
		<div className="flex flex-col gap-3">
			{
				gameDataArray.map((gameData, i) => {
					return (
						<div key={i} className="rounded p-3 bg-white border border-black border-solid">
							<div className="flex justify-between gap-2">
								<p className="rounded p-2 bg-black text-white">{gameData.scenario?.name}</p>
								<p className={`grow text-right font-bold`} style={{color: GAME_STATUS_COLOR[gameData.status]}}>{gameData.status.toUpperCase()}</p>
							</div>
							<div className="flex flex-row gap-2 mt-4">
								<div className="grow flex flex-col">
									<p className="pb-4">{gameData.evaluation?.simpleDescription}</p>
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
	)
}