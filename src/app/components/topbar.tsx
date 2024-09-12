import logo from "@/public/branding/logo.svg"
import { ProfileDataContext } from "@/app/(user)/contextWrapper"
import { useContext } from "react"

export default function TopbarComponent() {
	const { profileData } = useContext(ProfileDataContext)

	return (
		<div className="p-3 flex flex-row justify-between items-center">
			<a href="/" className="basis-16 min-w-0">
				<img src={logo.src} className="basis-16 grow-0 shrink-1" />
			</a>
			<a href="/account" className="font-bold">{profileData.username}</a>
		</div>
	)
}