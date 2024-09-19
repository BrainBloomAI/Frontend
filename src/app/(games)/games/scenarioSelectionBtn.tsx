"use client"

import { GamePreferences, ScenarioData } from "@/app/lib/definitions";
import { createNewGame, translateText } from "@/app/actions"
import { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import Alerts from "@/app/lib/ui/alerts";
import { useRouter, redirect } from "next/navigation";
import { getSession } from "@/app/lib/sessionManager";
import config from "@/app/config"
import { GamePrefContext } from "@/app/(games)/gamePrefsContext";

const WindowScenario = createContext<{errorMessageState?: string, setErrorMessageState?: Dispatch<SetStateAction<string|undefined>>}>({})
const NBSP = " " // non-breaking space for empty lines

const localiseTextDict: { [key: string]: string } = {} // cache of translations
const localiseText = async (text: string, prefs: GamePreferences) => {
	console.log(prefs)
	if (prefs.lang === 0) {
		return text
	} else {
		if (localiseTextDict[text]) {
			return localiseTextDict[text]
		}

		return translateText(text, prefs.lang)
	}
}

function ScenarioSelectionPanel({ scenarioList, prefs }: { scenarioList: Array<ScenarioData>, prefs: GamePreferences }) {
	let { setErrorMessageState } = useContext(WindowScenario)

	const [localisedNames, setLocalisedNames] = useState(scenarioList.map(s => NBSP)) // empty line
	const [clickDebounce, setClickDebounce] = useState(true)

	useEffect(() => {
		const _inner = async () => {
			setLocalisedNames(await Promise.all(localisedNames.map(async (_, i) => localiseText(scenarioList[i].name, prefs))))
		}

		_inner()
	}, [])

	return (
		scenarioList.map((scenario, i) => {
			return (
				<button
					key={i}
					className="bg-cover bg-center w-full aspect-square rounded border border-solid border-black bg-accent flex flex-col justify-end p-2"
					style={{backgroundImage: `url(${config.serverOrigin}/cdn/${scenario.backgroundImage})`}}
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
								redirect(`/games/${returnPayload.gameID}`) // .success is true, implies .gameID exists
							}
						}
					}
				>
					<p className="w-full p-2 text-white font-xl font-bold text-center bg-black rounded">{localisedNames[i]}</p>
				</button>
			)
		})
	)
}

export default function ScenarioSelectionWindow({ scenarioList, errorMessage }: { scenarioList: Array<ScenarioData>, errorMessage?: string }) {
	const { prefs } = useContext(GamePrefContext)
	const [errorMessageState, setErrorMessageState] = useState(errorMessage)

	return (
		<>
			<WindowScenario.Provider value={{errorMessageState, setErrorMessageState}}>
				<div className="grow min-h-0 overflow-y-auto grid grid-cols-2 auto-rows-min gap-4">
					{
						<ScenarioSelectionPanel scenarioList={scenarioList} prefs={prefs} />
					}
				</div>
				<Alerts message={errorMessageState} />
			</WindowScenario.Provider>
		</>
	)
}