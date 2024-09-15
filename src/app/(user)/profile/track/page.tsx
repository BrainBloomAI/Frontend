"use client"

import { useContext } from "react"
import { ProfileDataContext } from "@/app/lib/ui/contextWrapper"
import { StatsContainer } from "@/app/lib/ui/statsContainer"
import { redirect } from "next/navigation"

const GAME_STATUS_COLOR = {
	"ongoing": "#ff8f38",
	"complete": "#43c141",
	"abandoned": "#ff0000"
}

export default function AccountPage() {
	const { profileData } = useContext(ProfileDataContext)

	if (!profileData) {
		redirect("/profile")
	}

	return (
		<div className="p-8 flex flex-col h-svh">
			<div className="flex flex-row gap-2">
				<a href="/profile" className="text-2xl font-bold">&lt;</a>
				<h1 className="text-2xl pb-4 font-bold text-black">My progress</h1>
			</div>				
			<StatsContainer clientData={profileData} />
		</div>
	)
}