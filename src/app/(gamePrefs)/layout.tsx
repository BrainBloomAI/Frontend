"use server"

import { isAuthenticated } from "../actions";
import { redirect } from "next/navigation";
import GamePrefContextProvider, { GamePrefContext } from "./gamePrefsContext";

export default async function GameLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  if (!await isAuthenticated()) {
    return redirect("/login")
  }

  return (
    <GamePrefContextProvider children={children} />
  );
}
