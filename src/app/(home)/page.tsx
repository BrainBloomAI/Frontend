"use server"

import { isAuthenticated, isStaff } from "@/app/actions"
import logo from "@/public/branding/logo.png"

function StaffActionPanel() {
	return (
		<div className="flex flex-col gap-4">
			<a href="/scenarios/create" className="p-2 rounded border border-black border-solid text-black">Create scenarios</a>
			<a href="/clients/view" className="p-2 bg-black rounded text-white font-bold">View clients</a>
		</div>
	)
}

function UserActionPanel() {
	return (
		<div className="flex flex-col gap-4">
			<a href="/profile" className="p-2 rounded border border-black border-solid text-black">Profile</a>
			<a href="/games" className="p-2 bg-black rounded text-white font-bold">Play</a>
		</div>
	)
}

function GuestActionPanel() {
	return (
		<div className="flex flex-col gap-4">
			<a href="/signup" className="p-2 rounded border border-black border-solid text-black">Signup</a>
			<a href="/login" className="p-2 bg-black rounded text-white font-bold">Login</a>
		</div>
	)
}

export default async function LandingPage() {
	const isLoggedIn = await isAuthenticated()
	const isLoggedInAsStaff = isLoggedIn && await isStaff()

	return (
		<main id="guest-bg" className="p-8">
			<img className="w-full p-4 max-h-[250px] object-fit mb-24" src={logo.src} />
			{
				isLoggedIn ? (isLoggedInAsStaff ? <StaffActionPanel /> : <UserActionPanel />) : <GuestActionPanel />
			}
		</main>
	)
}