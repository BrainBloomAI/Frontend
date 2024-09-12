"use client"

import { useContext } from "react"
import { ProfileDataContext } from "@/app/(user)/contextWrapper"

export default function AccountPage() {
	const { profileData } = useContext(ProfileDataContext)

	console.log(profileData)

	return (
		<div className="p-8 flex flex-col items-center h-svh">
			<div id="headshot" className="rounded-full w-[80%] aspect-square border-2 border-black border-solid">
			</div>
			<div className="w-full flex flex-row">
				<div className="grow self-center">
					<p className="text-lg font-bold text-center">{profileData?.username}</p>
				</div>
				<div className="grow flex flex-col items-center">
					<p className="text-2xl font-bold">{profileData?.points}</p>
					<p className="">Points</p>
				</div>
			</div>
		</div>
	)
}