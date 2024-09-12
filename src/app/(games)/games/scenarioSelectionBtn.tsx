"use client"

import { ScenarioEntry } from "@/app/lib/definitions";
import { createNewGame } from "@/app/actions"
import { createContext, Dispatch, SetStateAction, useContext, useState } from "react";
import Alerts from "@/app/lib/ui/alerts";
import { useRouter } from "next/navigation";
import { getSession } from "@/app/lib/sessionManager";
import { GameTheme } from "@/app/(games)/games/config";

const WindowScenario = createContext<{errorMessageState?: string, setErrorMessageState?: Dispatch<SetStateAction<string|undefined>>}>({})

function ScenarioSelectionPanel({ scenarioList }: { scenarioList: Array<ScenarioEntry> }) {
	let { setErrorMessageState } = useContext(WindowScenario)
	let [clickDebounce, setClickDebounce] = useState(true)

	const router = useRouter()

	return (
		scenarioList.map((scenario, i) => {
			return (
				<button
					key={i}
					className="bg-cover bg-center w-full aspect-square rounded border border-solid border-black bg-accent flex flex-col justify-end p-2"
					style={{backgroundImage: `url(${GameTheme.serverOrigin}cdn/${scenario.backgroundImage})`}}
					onClick={
						async() => {
							// check debounce
							if (!clickDebounce) {
								return
							}
							setClickDebounce(false)

							// create new game
							let returnPayload = await createNewGame(scenario.scenarioID)
							if (!returnPayload.success) {
								// re-enable debounce
								setClickDebounce(true)

								if (setErrorMessageState) {
									setErrorMessageState(returnPayload.message) // show message
								}
							} else {
								router.push(`/games/${returnPayload.gameID}`) // .success is true, implies .gameID exists
							}
						}
					}
				>
					<p className="w-full p-2 text-white font-xl font-bold text-center bg-black rounded">{scenario.name}</p>
				</button>
			)
		})
	)
}

export default function ScenarioSelectionWindow({ scenarioList, errorMessage }: { scenarioList: Array<ScenarioEntry>, errorMessage?: string }) {
	const [errorMessageState, setErrorMessageState] = useState(errorMessage)

	return (
		<>
			<WindowScenario.Provider value={{errorMessageState, setErrorMessageState}}>
				<div className="grow min-h-0 overflow-y-auto grid grid-cols-2 auto-rows-min gap-4">
					{
						<ScenarioSelectionPanel scenarioList={scenarioList} />
					}
				</div>
				<Alerts message={errorMessageState} />
			</WindowScenario.Provider>
		</>
	)
}