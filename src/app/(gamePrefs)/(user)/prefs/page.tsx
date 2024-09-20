"use client"

import { useEffect, useContext, useState } from "react"
import { GamePrefContext } from "@/app/(gamePrefs)/gamePrefsContext"


export default function Prefs() {
	// change prefs
	const { prefs, setPrefs } = useContext(GamePrefContext)

	return (
		<div className="grow flex flex-col gap-2 p-8">
			<div className="grow flex flex-col gap-10">
				<section className="flex flex-col gap-2">
					<h2 className="mb-1 font-bold text-lg">Game preferences</h2>
					<label className="font-bold">Language</label>
					<select className="p-2" value={prefs.lang} onChange={e => {
						prefs.lang = parseInt(e.target.value) as 0|1|2|3
						console.log("setPrefs", setPrefs)
						if (setPrefs) {
							setPrefs(Object.assign({}, prefs))
						}
					}}>
						<option value="0">English</option>
						<option value="1">Mandarin</option>
						<option value="2">Bahasa Malaysia</option>
						<option value="3">Tamil</option>
					</select>
				</section>
				<section className="flex flex-col gap-2">
					<h2 className="mb-1 font-bold text-lg">Account</h2>
					<a href="/logout" className="p-2 rounded bg-black text-white font-bold">Logout</a>
				</section>
			</div>
			<a href="/profile" className="font-bold underline">Go back</a>
		</div>
	)
}