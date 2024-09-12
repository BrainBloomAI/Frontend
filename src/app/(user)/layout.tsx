"use client"

import TopbarComponent from "@/app/components/topbar";

import logo from "@/public/branding/logo.svg"
import { GameData, ProfileData } from "@/app/lib/definitions"
import { createContext, Dispatch, useState, SetStateAction } from "react";
import { getProfileData } from "@/app/actions";

// @ts-ignore
export const ProfileDataContext = createContext<{
  profileData?: ProfileData,
  setProfileData?: Dispatch<SetStateAction<ProfileData|undefined>>
}>({})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [profileData, setProfileData] = useState<ProfileData|undefined>()
  const [lifetimeGameData, setLifetimeGameData] = useState<GameData|undefined>()
  const [errorMessage, setErrorMessasge] = useState()

  getProfileData().then(payload => {
    if (payload.success) {
      return payload.data
    }

    throw new Error(payload.message ?? "Failed to communicate with server")
  }).catch(err => {
    setErrorMessasge(err.message)
  })

  return (
    <div id="guest-bg" className="relative flex flex-col bg-white h-svh">
      <ProfileDataContext.Provider value={{profileData, setProfileData}}>
        <TopbarComponent />
        {children}
      </ProfileDataContext.Provider>
    </div>
  );

}
