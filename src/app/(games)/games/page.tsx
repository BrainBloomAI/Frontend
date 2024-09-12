"use server"

import { GameTheme } from "@/app/(games)/games/config"
import { getScenarioList } from "@/app/actions"
import Alerts from "@/app/lib/ui/alerts"
import ScenarioSelectionWindow from "./scenarioSelectionBtn";

export default async function GameHomePage() {
	let scenarioList = await getScenarioList()
	let errorMessage: string|undefined;
	if (scenarioList == null) {
		// failed server-side
		scenarioList = []
		errorMessage = "Failed to load scenarios, please try again later"
	}

	return (
		<div className={`h-svh p-8 ${GameTheme.background} flex flex-col`}>
			<h1 className="font-bold text-2xl text-white pb-4">Select new game</h1>
			<ScenarioSelectionWindow scenarioList={scenarioList} />
			<Alerts message={errorMessage} />
		</div>
	)
}