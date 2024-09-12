"use client"

import { ProfileData } from "@/app/lib/definitions";
import {Dispatch, useState, SetStateAction, createContext } from "react";
import TopbarComponent from "../components/topbar";

export const ProfileDataContext = createContext<{
  profileData?: ProfileData,
  setProfileData?: Dispatch<SetStateAction<ProfileData>>
}>({})

export default function UserWrapper({ profileData, children }: { profileData: ProfileData, children: React.ReactNode }) {
	const [profileDataState, setProfileDataState] = useState(profileData)

	return (
		<ProfileDataContext.Provider value={{profileData: profileDataState, setProfileData: setProfileDataState}}>
			<TopbarComponent />
			{children}
		</ProfileDataContext.Provider>
	)
}