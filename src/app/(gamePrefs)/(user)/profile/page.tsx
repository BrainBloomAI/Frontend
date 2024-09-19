"use client"

import { useContext } from "react"
import { ProfileDataContext } from "@/app/lib/ui/contextWrapper"

import headshot from "@/public/branding/profile.webp"

export default function AccountPage() {
	const { profileData } = useContext(ProfileDataContext)

	return (
		<div className="p-8 pt-0 flex flex-col items-center h-svh">
			<div id="headshot" className="rounded-full w-[80%] aspect-square border-2 border-black border-solid overflow-clip">
				<img className="w-full h-full object-fit" src={headshot.src} />
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
			<div className="grow flex flex-col justify-end gap-4 w-full mt-2 self-end">
				<a href={"/profile/games"} className="p-3 rounded text-bold text-white bg-[#141414] text-center">Past Games</a>
				<a href={"/profile/badges"} className="p-3 rounded text-bold text-white bg-[#141414] text-center">Badges</a>
				<a href={"/profile/track"} className="p-3 rounded text-bold text-white bg-[#141414] text-center">Goals</a>
				<a href={"/prefs"} className="p-3 rounded text-bold text-white bg-[#141414] text-center">Settings</a>
			</div>
		</div>
	)
}