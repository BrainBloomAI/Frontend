"use server"

import { getProfileData, getScenarioList } from "@/app/actions"
import { redirect } from "next/navigation";
import { ExtProfileData } from "@/app/lib/definitions";
import GameSelectionWindow from "@/app/(games)/games/selectionWindow";

export default async function GameHomePage() {
	let scenarioList = await getScenarioList()
	let errorMessage: string|undefined;
	if (scenarioList == null) {
		// failed server-side
		scenarioList = []
		errorMessage = "Failed to load scenarios, please try again later"
		redirect("/login")
	}

	let profileDataPayload = await getProfileData()
	let profileData: ExtProfileData|null = null;
	if (profileDataPayload.success) {
		profileData = profileDataPayload.data!
	}

	return (
		<GameSelectionWindow profileData={profileData} scenarioList={scenarioList} errorMessage={errorMessage} />
	)
}
