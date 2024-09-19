"use client"

import config from "@/app/config"
import { GamePrefContext } from "@/app/(gamePrefs)/gamePrefsContext"
import { useEffect, useContext, useState } from "react"
import { ExtProfileData, GamePreferences, ScenarioData } from "@/app/lib/definitions"
import ScenarioSelectionWindow from "@/app/(gamePrefs)/(games)/games/scenarioSelectionBtn"
import Alerts from "@/app/lib/ui/alerts"

export default function GameSelectionWindow({ profileData, scenarioList, errorMessage }: { profileData?: ExtProfileData|null, scenarioList: Array<ScenarioData>, errorMessage?: string }) {
	const { prefs } = useContext(GamePrefContext)

	return (
		<div className={`h-svh p-8 flex flex-col`} style={{backgroundColor: config.GameTheme.background}}>
			<div className="flex items-center gap-3 justify-between md:justify-start pb-4">
				<h1 className="font-bold text-2xl text-white">{["Select new game", "先择新游戏"][prefs.lang]}</h1>
				{ profileData && profileData.activeGame && <a href="/abandon" className="p-2 rounded bg-[rgb(255_45_45)] font-bold text-white">{["Abandon", "退出"][prefs.lang]}</a> }
			</div>
			<ScenarioSelectionWindow scenarioList={scenarioList} />
			<a href="/" className="font-bold text-white underline">{["Go to home", "回去"][prefs.lang]}</a>
			<Alerts message={errorMessage} />
		</div>
	)
}