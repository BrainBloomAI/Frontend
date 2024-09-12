"use server"

import TopbarComponent from "@/app/components/topbar";

import logo from "@/public/branding/logo.svg"
import { GameData, ProfileData } from "@/app/lib/definitions"
import { getProfileData } from "@/app/actions";
import Alerts from "@/app/lib/ui/alerts"
import UserWrapper from "@/app/(user)/contextWrapper";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const payload = await getProfileData()
  let errorMessage = ""
  if (!payload.success) {
    errorMessage = "Failed to communicate with server"
  }

  return (
    <div id="guest-bg" className="relative flex flex-col bg-white h-svh">
      {payload.success && <UserWrapper profileData={payload.data!} children={children} />}
      <Alerts message={errorMessage} />
    </div>
  );
}
