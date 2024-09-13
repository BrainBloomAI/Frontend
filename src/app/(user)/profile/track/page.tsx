"use client"

import { useContext } from "react"
import { ProfileDataContext } from "@/app/lib/ui/contextWrapper"

const GAME_STATUS_COLOR = {
	"ongoing": "#ff8f38",
	"complete": "#43c141",
	"abandoned": "#ff0000"
}

export default function AccountPage() {
	const { profileData } = useContext(ProfileDataContext)
	console.log(profileData)

	return (
		<div className="p-8 flex flex-col h-svh">
			<div className="flex flex-row gap-2">
				<a href="/profile" className="text-2xl font-bold">&lt;</a>
				<h1 className="text-2xl pb-4 font-bold text-black">My progress</h1>
			</div>				
			{
				profileData.mindsAssessment ?
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
													<p className="self-end">{profileData[`minds${metricKey}`]}</p>
													<div className="relative w-full h-4 rounded bg-slate-500 border border-slate-300 border-solid">
														<div className="absolute top-0 left-0 h-full scale-x-0 origin-left"
															style={{
																backgroundColor: "rgb(0 255 0)",
																width: `${profileData[`minds${metricKey}`]}%`,
																animationName: "grow-in",
																animationDelay: "1500ms",
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
					<p className="grow">{profileData.mindsAssessment}</p>
					</>) :
					(
						<div className="py-8">
							<p className="text-4xl font-bold">Pending evaluation from MINDS Staff</p>
						</div>
					)
			}
		</div>
	)
}