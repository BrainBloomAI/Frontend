"use server"

import { isAuthenticated } from "@/app/actions";
import { redirect } from "next/navigation";

export default async function GameLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  if (!await isAuthenticated()) {
    return redirect("/login")
  }

  return (
    <>
      {children}
    </>
  );
}
