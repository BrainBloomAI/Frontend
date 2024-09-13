"use client"

import { useContext } from "react"
import { ProfileDataContext } from "@/app/lib/ui/contextWrapper"
import { GameCardContainer } from "@/app/lib/ui/gameCardContainer"

export default function AccountPage() {
	const { profileData } = useContext(ProfileDataContext)
	console.log(profileData)

	return (
		<div className="p-8 flex flex-col h-svh">
			<div className="flex flex-row gap-2">
				<a href="/profile" className="text-2xl font-bold">&lt;</a>
				<h1 className="text-2xl pb-4 font-bold text-black">My games</h1>
			</div>
			<GameCardContainer gameDataArray={profileData.games} />
		</div>
	)
}