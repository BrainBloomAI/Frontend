"use client"

import { ExtProfileData } from "@/app/lib/definitions";
import {Dispatch, useState, SetStateAction, createContext } from "react";
import TopbarComponent from "@/app/components/topbar";

export const ProfileDataContext = createContext<{
  profileData: ExtProfileData,
  setProfileData: Dispatch<SetStateAction<ExtProfileData>>
}>({})

export default function UserWrapper({ profileData, children }: { profileData: ExtProfileData, children: React.ReactNode }) {
	const [profileDataState, setProfileDataState] = useState(profileData)

	return (
		<ProfileDataContext.Provider value={{profileData: profileDataState, setProfileData: setProfileDataState}}>
			<TopbarComponent />
			{children}
		</ProfileDataContext.Provider>
	)
}