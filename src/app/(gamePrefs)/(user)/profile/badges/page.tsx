"use client"

import { useContext } from "react"
import { ProfileDataContext } from "@/app/lib/ui/contextWrapper"
import { StaticImageData } from "next/image"

import badge_1 from "@/public/badges/1.png"
import badge_2 from "@/public/badges/2.png"
import badge_3 from "@/public/badges/3.png"
import badge_4 from "@/public/badges/4.png"
import badge_5 from "@/public/badges/5.png"
import badge_6 from "@/public/badges/6.png"
import badge_7 from "@/public/badges/7.png"
import badge_8 from "@/public/badges/8.png"
import badge_9 from "@/public/badges/9.png"
import badge_10 from "@/public/badges/10.png"
import badge_11 from "@/public/badges/11.png"
import badge_12 from "@/public/badges/12.png"
import badge_13 from "@/public/badges/13.png"
import badge_14 from "@/public/badges/14.png"
import badge_15 from "@/public/badges/15.png"
import badge_16 from "@/public/badges/16.png"
import badge_17 from "@/public/badges/17.png"
import badge_18 from "@/public/badges/18.png"
import badge_19 from "@/public/badges/19.png"
import badge_20 from "@/public/badges/20.png"
import badge_21 from "@/public/badges/21.png"
import badge_22 from "@/public/badges/22.png"
import badge_23 from "@/public/badges/23.png"
import badge_24 from "@/public/badges/24.png"
import badge_25 from "@/public/badges/25.png"
import badge_26 from "@/public/badges/26.png"
import badge_27 from "@/public/badges/27.png"
import badge_28 from "@/public/badges/28.png"
import badge_29 from "@/public/badges/29.png"
import badge_30 from "@/public/badges/30.png"
import badge_31 from "@/public/badges/31.png"
import badge_32 from "@/public/badges/32.png"
import badge_33 from "@/public/badges/33.png"
import badge_34 from "@/public/badges/34.png"
import badge_35 from "@/public/badges/35.png"
import badge_36 from "@/public/badges/36.png"
import badge_37 from "@/public/badges/37.png"
import badge_38 from "@/public/badges/38.png"
import badge_39 from "@/public/badges/39.png"
import badge_40 from "@/public/badges/40.png"
import badge_41 from "@/public/badges/41.png"
import badge_42 from "@/public/badges/42.png"
import badge_43 from "@/public/badges/43.png"
import badge_44 from "@/public/badges/44.png"
import badge_45 from "@/public/badges/45.png"
import badge_46 from "@/public/badges/46.png"
import badge_47 from "@/public/badges/47.png"
import badge_48 from "@/public/badges/48.png"

const BADGES_IMG = [
  badge_1, badge_2, badge_3, badge_4, badge_5, badge_6, badge_7, badge_8, badge_9, badge_10,
  badge_11, badge_12, badge_13, badge_14, badge_15, badge_16, badge_17, badge_18, badge_19, badge_20,
  badge_21, badge_22, badge_23, badge_24, badge_25, badge_26, badge_27, badge_28, badge_29, badge_30,
  badge_31, badge_32, badge_33, badge_34, badge_35, badge_36, badge_37, badge_38, badge_39, badge_40,
  badge_41, badge_42, badge_43, badge_44, badge_45, badge_46, badge_47, badge_48
];


const GAME_STATUS_COLOR = {
	"ongoing": "#ff8f38",
	"complete": "#43c141",
	"abandoned": "#ff0000"
}

type BadgeData = {
	backgroundImage: StaticImageData // ${serverOrigin}/cdn/badges/${backgroundImage}
}

function BadgeContainer({ badges, active }: { badges: Array<BadgeData>, active: boolean }) {
	return (
		<div className="grid grid-cols-2 auto-rows-min gap-4">
			{
				badges.map((data, i) => {
					return (
						<div className="relative flex flex-col items-center justify-end w-full aspect-square p-2 rounded bg-white border-2 border-solid"
							style={{
								borderColor: active ? "black" : "black"
							}}
						>
							<img src={data.backgroundImage.src}
								className="absolute top-0 left-0 w-full h-full object-fit"
								style={{
									filter: active ? "saturate(1)" : "saturate(0)"
								}}
							/>
							<p className="z-10 p-2 rounded bg-black text-white">Silver</p>
						</div>
					)
				})
			}
		</div>
	)
}

export default function AccountPage() {
	const { profileData } = useContext(ProfileDataContext)

	let owned = [1, 10, 16]
	let notOwned = []
	for (let i = 0; i < 48; i++) {
		if (owned.indexOf(i +1) !== -1) {
			continue
		}

		notOwned.push(i +1)
	}

	const badges = owned.map(i => {
		return {
			backgroundImage: BADGES_IMG[i -1]
		}
	})
	const pendingBadges = notOwned.map(i => {
		return {
			backgroundImage: BADGES_IMG[i -1]
		}
	})

	console.log(badges)
	console.log(pendingBadges)

	return (
		<div className="p-8 flex flex-col h-svh">
			<div className="flex flex-row gap-2">
				<a href="/profile" className="text-2xl font-bold">&lt;</a>
				<h1 className="text-2xl pb-4 font-bold text-black">My badges</h1>
			</div>
			<BadgeContainer badges={badges} active={true} />
			<h1 className="text-2xl py-4 font-bold text-black">Unachieved</h1>
			<BadgeContainer badges={pendingBadges} active={false} />
		</div>
	)
}