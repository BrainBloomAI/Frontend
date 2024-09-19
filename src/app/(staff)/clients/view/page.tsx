"use client"

import { useContext, useEffect, useState } from "react"
import { ProfileDataContext } from "@/app/lib/ui/contextWrapper"
import { getAllClients } from "@/app/actions"
import { ProfileData } from "@/app/lib/definitions"

export default function StaffViewClientsDashhboard() {
	const { profileData } = useContext(ProfileDataContext)

	const [allClientData, setAllClientData] = useState<Array<ProfileData>|null>(null)
	useEffect(() => {
		const fetchData = async () => {
			const payload = await getAllClients()

			if (payload.success) {
				setAllClientData(payload.data!)
			}
		}

		fetchData()
	}, [])

	const exportClientData = async (clientUsername: string) => {
		fetch(`/api/export/${clientUsername}`).then(r => {
			if (r.status === 200) {
				return r.json()
			}

			throw new Error(`Invalid status ${r.status}`)
		}).then(data => {
			if (data.success) {
				let fileContent = data.content

				let blob = new Blob([fileContent], { type: "text/csv;charset=utf-8" })
				let url = URL.createObjectURL(blob)

				let a = document.createElement("a")
				a.href = url
				a.download = `${clientUsername}_data.csv`
				a.click()
			}
		})
	}

	return (
		<div className="p-8 flex flex-col h-svh">
			<div className="flex flex-col gap-2 mb-8">
				<div className="flex gap-3">
					<input className="p-3 rounded border-2 border-black border-solid min-w-0 grow" type="text" placeholder="Search by name"/>
					<button className="p-3 rounded border-2 border-black border-solid bg-white font-bold text-black">Search</button>
				</div>
				<button className="inline-block w-max p-2 rounded text-sm bg-white border border-solid border-black text-black">Create new user</button>
			</div>
			<div className="flex flex-col gap-4 pb-8">
				{
					allClientData?.map((clientData, i) => {
						return (
							<div key={i} className="p-2 rounded bg-white border border-black border-solid">
								<p className="bg-black inline-block rounded text-white font-bold p-2">{clientData.username}</p>
								<p className="pt-2">Points: {clientData.points}</p>
								<p className="">Created: {new Date(clientData.created).toLocaleString("en-SG")}</p>
								<p className="">Assessment: {clientData.mindsAssessment ?? "Not yet onboarded"}</p>
								<div className="flex justify-end gap-2 mt-4">
									<button onClick={() => exportClientData(clientData.username)} className="p-2 rounded bg-white border-2 border-solid border-black font-bold text-black">Export</button>
									{ clientData.mindsAssessment && <a href={`/clients/view/${clientData.userID}/stats`} className="p-2 rounded bg-white border-2 border-solid border-black font-bold text-black">Assessment</a> }
									{ !clientData.mindsAssessment && <a href={`/clients/view/${clientData.userID}/onboard`} className="p-2 rounded bg-white border-2 border-solid border-black font-bold text-black">Onboard</a> }
									<a href={`/clients/view/${clientData.userID}`} className="p-2 rounded bg-black font-bold text-white">Games</a>
								</div>
							</div>
						)
					})
				}
			</div>
		</div>
	)
}