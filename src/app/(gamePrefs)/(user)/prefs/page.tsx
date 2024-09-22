"use client"

import { useEffect, useContext, useState } from "react"
import { ProfileDataContext } from "@/app/lib/ui/contextWrapper"
import { GamePrefContext } from "@/app/(gamePrefs)/gamePrefsContext"
import { langList, langDict } from "@/app/lib/languages"


export default function Prefs() {
	// change prefs
	const { prefs, setPrefs } = useContext(GamePrefContext)
	const { profileData } = useContext(ProfileDataContext)

	return (
		<div className="grow flex flex-col gap-2 p-8">
			<div className="grow flex flex-col gap-10">
				<section className="flex flex-col gap-2">
					<h2 className="mb-1 font-bold text-xl">Game preferences</h2>
					<label className="font-bold">Language</label>
					<select className="p-2 rounded bg-white" value={prefs.lang} onChange={e => {
						prefs.lang = parseInt(e.target.value) as 0|1|2|3|4
						console.log("setPrefs", setPrefs)
						if (setPrefs) {
							setPrefs(Object.assign({}, prefs))
						}
					}}>
						{
							langList.map((lang, i) => 
								<option key={i} value={i}>{langDict[lang].name}</option>
							)
						}
					</select>
				</section>
				<section className="flex flex-col gap-2">
					<h2 className="mb-1 font-bold text-xl">Account</h2>
					<label className="font-bold">Email</label>
					<input className="p-2 rounded bg-white" type="text" value={profileData?.email} disabled />
					<p className="text-sm mb-4">Please reach out to support@brainbloom.ai to change email address.</p>
					<a href="/logout" className="p-2 rounded border-[rgb(255_45_45)] border-solid border text-[rgb(255_45_45)] font-bold">Logout</a>
				</section>
				<a href="/profile" className="p-2 rounded bg-black text-white font-bold mt-auto">Save</a>
			</div>
		</div>
	)
}