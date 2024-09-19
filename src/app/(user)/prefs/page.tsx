"use client"

import { useEffect, useState } from "react"


export default function Prefs() {
	// change prefs
	const [prefs, setPrefs] = useState({lang: 1 as 0|1|2|3})

	useEffect(() => {
		const getPrefs = () => {
			let rawPrefs = window.localStorage.getItem("prefs")
			if (rawPrefs) {
				return JSON.parse(rawPrefs)
			} else {
				return {
					lang: 1 as 0|1|2|3
				}
			}
		}

		setPrefs(getPrefs())
	}, [])

	useEffect(() => {
		localStorage.setItem("prefs", JSON.stringify(prefs))
		console.log("FIRED")
	}, [prefs])

	return (
		<div className="grow flex flex-col gap-2 p-8">
			<div className="grow flex flex-col gap-2">
				<label className="font-bold">Language</label>
				<select className="p-2" value={prefs.lang} onChange={e => {
					prefs.lang = parseInt(e.target.value) as 0|1|2|3
					setPrefs(Object.assign({}, prefs))
				}}>
					<option value="0">English</option>
					<option value="1">Mandarin</option>
					<option value="2">Behasa Melayu</option>
					<option value="3">Hindu</option>
				</select>
			</div>
			<a href="/profile" className="font-bold underline">Go back</a>
		</div>
	)
}