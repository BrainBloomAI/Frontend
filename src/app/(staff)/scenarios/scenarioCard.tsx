"use client"

import { deleteScenario } from "@/app/actions";
import { ScenarioData } from "@/app/lib/definitions";

export default function ScenarioCard({ scenarioData }: { scenarioData: ScenarioData }) {
	return (
		<div className="flex flex-col p-2 rounded bg-white border border-solid border-black">
			<p className="inline-block min-w-0 w-max p-2 rounded bg-black font-bold text-white">{scenarioData.name}</p>
			<p className="grow pt-2 text-sm">{scenarioData.description}</p>
			<div className="flex justify-end mt-4 gap-2">
				<button className="p-2 rounded bg-white text-black border border-solid border-black font-bold self-end" onClick={() => {
					deleteScenario(scenarioData.scenarioID)
				}}>Delete</button>
				<button className="p-2 rounded bg-black text-white font-bold self-end">Manage</button>
			</div>
		</div>
	)
}