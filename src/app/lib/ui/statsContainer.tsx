import { ExtProfileData } from "@/app/lib/definitions";

export function StatsContainer({ clientData, showOnboardBtn=false }: { clientData: ExtProfileData, showOnboardBtn: boolean }) {
	return 	clientData?.mindsAssessment ?
		(<><table className="w-full min-h-0 overflow-auto">
			<tbody>
				{
					["Listening", "EQ", "Tone", "Helpfulness", "Clarity"].map((metric, i) => {
						let metricKey = metric as "Listening"|"EQ"|"Tone"|"Helpfulness"|"Clarity"
						return (
							<tr key={i}>
								<td className="pb-2 pr-4 align-bottom">{metric}</td>
								<td className="pb-2 w-full">
									<div className="flex flex-col gap-2">
										<p className="self-end">{clientData[`minds${metricKey}`]}</p>
										<div className="relative w-full h-4 rounded bg-slate-500 border border-slate-300 border-solid">
											<div className="absolute top-0 left-0 h-full scale-x-0 origin-left"
												style={{
													backgroundColor: "rgb(0 255 0)",
													width: `${clientData[`minds${metricKey}`]}%`,
													animationName: "grow-in",
													animationDuration: "2s",
													animationFillMode: "forwards",
													animationTimingFunction: "ease-out"
												}}>
											</div>
										</div>
									</div>
								</td>
							</tr>
						)
					})
				}
			</tbody>
		</table>
		<p className="font-bold text-xl pt-4">Assessment</p>
		<p className="grow">{clientData.mindsAssessment}</p>
		</>) :
		(
			<div className="flex flex-col gap-4 items-start py-8">
				<p className="text-4xl font-bold">Pending evaluation from MINDS Staff</p>
				{showOnboardBtn && <a href={`/clients/view/${clientData.userID}/onboard`} className="p-2 rounded bg-black font-bold text-white">Onboard</a>}
			</div>
		)
}