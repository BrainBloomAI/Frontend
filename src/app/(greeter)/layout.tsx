"use server"

import logo from "@/public/branding/logo.svg"
import { isAuthenticated } from "../actions";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  if (await isAuthenticated()) {
    return redirect("/games")
  }

  return (
    <>
      <div id="guest-bg" className="p-8 flex flex-col bg-white h-svh">
        <figure className="w-full basis-24 grow-0 shrink min-h-0 p-4 mb-24">
          <img src={logo.src} className="h-full w-full object-contain" />
        </figure>
        {children}
      </div>
    </>
  );
}
