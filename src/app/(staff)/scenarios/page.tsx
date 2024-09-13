"use server"

import { deleteScenario, getScenarioList } from "@/app/actions"
import Alerts from "@/app/lib/ui/alerts";
import ScenarioCard from "./scenarioCard";

export default async function ScenarioViewList() {
	const scenarioList = await getScenarioList()
	let errorMessage: string|undefined;
	if (!scenarioList) {
		errorMessage = "Failed to obtain scenario list"
	}

	return (
		<main className="relative p-8">
			<h1 className="font-bold text-black text-2xl pb-2">Created scenarios</h1>
			<a href={`/scenarios/create`} className="mb-4 inline-block w-max p-2 rounded text-sm bg-white border border-solid border-black text-black">Create new scenario</a>
			<div className="grid grid-cols-3 gap-4">
				{
					scenarioList && scenarioList.map((scenarioData, i) => {
						return <ScenarioCard key={i} scenarioData={scenarioData} />
					})
				}
			</div>
			<Alerts message={errorMessage} />
		</main>
	)
}