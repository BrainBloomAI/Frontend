"use server"

import { getProfileData, getScenarioList } from "@/app/actions"
import Alerts from "@/app/lib/ui/alerts"
import ScenarioSelectionWindow from "./scenarioSelectionBtn";
import config from "@/app/config"
import { redirect } from "next/navigation";
import { ExtProfileData } from "@/app/lib/definitions";

export default async function GameHomePage() {
	let scenarioList = await getScenarioList()
	let errorMessage: string|undefined;
	if (scenarioList == null) {
		// failed server-side
		scenarioList = []
		errorMessage = "Failed to load scenarios, please try again later"
		redirect("/login")
	}

	let profileDataPayload = await getProfileData() // TODO: remove bloat
	let profileData: ExtProfileData|null = null;
	if (profileDataPayload.success) {
		profileData = profileDataPayload.data!
	}

	return (
		<div className={`h-svh p-8 flex flex-col`} style={{backgroundColor: config.GameTheme.background}}>
			<div className="flex items-center gap-3 justify-between md:justify-start pb-4">
				<h1 className="font-bold text-2xl text-white">Select new game</h1>
				{ profileData && profileData.activeGame && <a href="/abandon" className="p-2 rounded bg-[rgb(255_45_45)] font-bold text-white">Abandon</a> }
			</div>
			<ScenarioSelectionWindow scenarioList={scenarioList} />
			<a href="/" className="font-bold text-white underline">Go to home</a>
			<Alerts message={errorMessage} />
		</div>
	)
}