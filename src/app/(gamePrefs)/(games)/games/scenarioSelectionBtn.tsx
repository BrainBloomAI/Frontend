"use client"

import { GamePreferences, ScenarioData } from "@/app/lib/definitions";
import { createNewGame, translateText, updateMindsEvaluation } from "@/app/actions"
import { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { GamePrefContext } from "@/app/(gamePrefs)/gamePrefsContext";
import Alerts from "@/app/lib/ui/alerts";
import { useRouter } from "next/navigation";
import config from "@/app/config"

const WindowScenario = createContext<{errorMessageState?: string, setErrorMessageState?: Dispatch<SetStateAction<string|undefined>>}>({})
const NBSP = " " // non-breaking space for empty lines

const localiseTextDict: { [key: string]: string } = {} // cache of translations
const localiseText = async (text: string, prefs: GamePreferences) => {
	console.log("minion", prefs)
	if (prefs.lang === 0) {
		return text
	} else {
		if (localiseTextDict[text]) {
			return localiseTextDict[text]
		}

		let translateResult = await translateText(text, prefs.lang)
		if (translateResult == null) {
			console.warn("localiseText failed internally")
		}
		return translateResult ?? text // fallback to pre-translated text
	}
}

let updateId = 0
function ScenarioSelectionPanel({ scenarioList }: { scenarioList: Array<ScenarioData> }) {
	const { prefs } = useContext(GamePrefContext)
	let { setErrorMessageState } = useContext(WindowScenario)

	const [localisedNames, setLocalisedNames] = useState(scenarioList.map(s => NBSP)) // empty line
	const [clickDebounce, setClickDebounce] = useState(true)

	const router = useRouter()

	console.log("SMALL PREFS", prefs)
	useEffect(() => {
		console.log("BIG PREFS", prefs)
		let _id = ++updateId
		const _inner = async () => {
			console.log("called again", scenarioList[0].name, prefs)
			const translateResult = await Promise.all(localisedNames.map(async (_, i) => localiseText(scenarioList[i].name, prefs)))
			console.log("results!", translateResult[0], _id, updateId)
			if (_id === updateId) {
				setLocalisedNames(translateResult)
			}
		}

		_inner()
	}, [prefs])

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
								router.push(`/games/${returnPayload.gameID}`) // .success is true, implies .gameID exists
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