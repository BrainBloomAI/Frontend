"use server"

import { isAuthenticated } from "@/app/actions"
import logo from "@/public/branding/logo.svg"

function UserActionPanel() {
	return (
		<div className="flex flex-col gap-4">
			<a href="/games" className="p-2 bg-black rounded text-white font-bold">Play</a>
			<a href="/profile" className="p-2 border border-black border-solid text-black">Profile</a>
		</div>
	)
}

function GuestActionPanel() {
	return (
		<div className="flex flex-col gap-4">
			<a href="/login" className="p-2 bg-black rounded text-white font-bold">Login</a>
			<a href="/signup" className="p-2 border border-black border-solid text-black">Singup</a>
		</div>
	)
}

export default async function LandingPage() {
	const isLoggedIn = await isAuthenticated()

	return (
		<main id="guest-bg" className="p-8">
			<img className="w-full max-h-[250px] object-fit" src={logo.src} />
			<GuestActionPanel />
		</main>
	)
}