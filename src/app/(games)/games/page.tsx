"use server"

import { getScenarioList } from "@/app/actions"
import Alerts from "@/app/lib/ui/alerts"
import ScenarioSelectionWindow from "./scenarioSelectionBtn";
import config from "@/app/config"

export default async function GameHomePage() {
	let scenarioList = await getScenarioList()
	let errorMessage: string|undefined;
	if (scenarioList == null) {
		// failed server-side
		scenarioList = []
		errorMessage = "Failed to load scenarios, please try again later"
	}

	return (
		<div className={`h-svh p-8 flex flex-col`} style={{backgroundColor: config.GameTheme.background}}>
			<h1 className="font-bold text-2xl text-white pb-4">Select new game</h1>
			<ScenarioSelectionWindow scenarioList={scenarioList} />
			<a href="/" className="font-bold text-white underline">Go to home</a>
			<Alerts message={errorMessage} />
		</div>
	)
}