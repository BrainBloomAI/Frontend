"use server"

import TopbarComponent from "@/app/components/topbar";

import logo from "@/public/branding/logo.png"
import { GameData, ProfileData } from "@/app/lib/definitions"
import { getProfileData, isStaff } from "@/app/actions";
import Alerts from "@/app/lib/ui/alerts"
import UserWrapper from "@/app/lib/ui/contextWrapper";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!await isStaff()) {
    return redirect("/")
  }

  const payload = await getProfileData()
  let errorMessage: string|undefined;
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
