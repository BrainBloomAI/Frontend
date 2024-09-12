"use client"

import { useContext } from "react"
import { ProfileDataContext } from "@/app/(user)/layout"

export default function AccountPage() {
	const { profileData } = useContext(ProfileDataContext)

	return (
		<div className="p-8 flex flex-col items-center h-svh">
			<div id="headshot" className="rounded-full w-[80%] aspect-square border-2 border-black border-solid">
			</div>
			<div className="flex flex-row">
				<p className="text-lg font-bold">{profileData?.username}</p>
				<div className="flex flex-col">
					<p className="text-2xl font-bold">{profileData?.points}</p>
					<p className="">Points</p>
				</div>
			</div>
		</div>
	)
}