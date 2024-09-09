"use server"

import { GameTheme } from "@/app/(games)/games/config"
import { getScenarioList } from "@/app/actions"
import { ScenarioEntry } from "@/app/lib/definitions";
import Alerts from "@/app/lib/ui/alerts";

export default async function GameHomePage() {
	let scenarioList = await getScenarioList()
	let errorMessage: string|undefined;
	if (scenarioList == null) {
		// failed server-side
		scenarioList = []
		errorMessage = "Failed to load scenarios, please try again later"
	}

	console.log(scenarioList)

	return (
		<div className={`relative h-svh p-8 ${GameTheme.background}`}>
			{
				scenarioList.map((scenario, i) => {
					return (
						<div key={i} style={{backgroundImage: `url(${scenario.backgroundImage})`}}>
							<p>{scenario.name}</p>
						</div>
					)
				})
			}
			<Alerts message={errorMessage} />
		</div>
	)
}