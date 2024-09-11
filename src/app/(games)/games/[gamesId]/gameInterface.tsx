"use client"

import asset_01 from "@/public/games/asset_01.png"

import { Microphone } from "@phosphor-icons/react"

import { StaticImageData } from "next/image"
import { Game } from "@/app/lib/controllers/game"
import { GameDescriptionData, GameData, SPEAKER_ID } from "@/app/lib/definitions"
import { redirect } from "next/navigation"
import { Dispatch, RefObject, SetStateAction, useEffect, useReducer, useRef, useState } from "react"
import { Console } from "console"
import { SpeechRecognitionWrapper } from "@/app/lib/synthesiser"
import { updateSession } from "@/app/lib/sessionManager"
import { GameTheme } from "@/app/(games)/games/config"

const activeDialogueInFocus = "font-bold text-2xl text-white"
const activeDialogueOutOfFocus = "font-bold text-xl text-slate-200"

const NBSP = " " // non-breaking space for empty lines

const typeText = async (text: string, containerRef: RefObject<HTMLDivElement>, typingContentState: Dispatch<SetStateAction<string>>) => {
	if (!containerRef.current) {
		return
	}

	// clear contents
	typingContentState("")
	containerRef.current.children[0].classList.toggle("animate-pulse", true)

	// resolve promise when typing actions are done
	return new Promise((resolve: (value?: undefined) => void) => {
		let charPointer = 0
		let intervalId: NodeJS.Timeout;
		intervalId = setInterval(() => {
			if (!containerRef.current) {
				return clearTimeout(intervalId)
			}

			typingContentState(text.slice(0, charPointer++))
			if (charPointer >= text.length) {
				containerRef.current.children[0].classList.toggle("animate-pulse", false)

				resolve()
				return clearTimeout(intervalId)
			}
		}, 50)
	})
}

const shiftScroll = (
	parentRef: RefObject<HTMLDivElement>,
	prevText: {
		ref: RefObject<HTMLParagraphElement>,
		contents: string,
		direction: "left"|"center"|"right"
	},
	currText: {
		ref: RefObject<HTMLParagraphElement>,
		contents: string,
		direction: "left"|"center"|"right"
	},
) => {
	if (!prevText.ref.current || !currText.ref.current || !parentRef.current) {
		return
	}

	// apply contents
	prevText.ref.current.innerHTML = prevText.contents
	prevText.ref.current.style.textAlign = prevText.direction
	currText.ref.current.innerHTML = currText.contents
	currText.ref.current.style.textAlign = currText.direction

	// dont animate
	prevText.ref.current.style.transitionDuration = `0s` // unset
	currText.ref.current.style.transitionDuration = `0s` // unset

	// hide curr text to compute height
	currText.ref.current.style.visibility = "hidden"
	currText.ref.current.style.transform = `translateY(100%)`

	// expand container depending on currTextRef.current.offsetHeight
	parentRef.current.style.height = `${currText.ref.current.offsetHeight}px`

	// animate
	prevText.ref.current.style.transitionDuration = `1s` // unset
	currText.ref.current.style.transitionDuration = `1s` // unset

	// apply transform via css
	currText.ref.current.style.visibility = "visible" // show hidden current text to shift up
	prevText.ref.current.style.transform = `translateY(-${prevText.ref.current.offsetHeight}px)`
	currText.ref.current.style.transform = `translateY(0)` // unset

	setTimeout(() => {
		if (!prevText.ref.current || !currText.ref.current || !parentRef.current) {
			return
		}

		// reset container height
		parentRef.current.style.height = "auto"

		// dont animate
		prevText.ref.current.style.transitionDuration = `0s` // unset
		currText.ref.current.style.transitionDuration = `0s` // unset

		// shift back to actual p tag
		prevText.ref.current.style.transform = `translateY(0)` // unset
		currText.ref.current.style.transform = `translateY(100%)` // unset

		prevText.ref.current.innerHTML = currText.contents // show current text
		currText.ref.current.innerHTML = "" // remove text
		prevText.ref.current.style.textAlign = currText.direction // apply current direction

		// animate for the next shift
		setTimeout(() => {
			if (!prevText.ref.current || !currText.ref.current) {
				return
			}

			prevText.ref.current.style.transitionDuration = `1s` // unset
			currText.ref.current.style.transitionDuration = `1s` // unset
		}, 300)
	}, 1000) // after transition is finished
}

export default function GameInterface({ gamesId }: { gamesId: string }) {
	const gameController = new Game()

	const shiftTextParentRef = useRef<HTMLDivElement>(null)
	const prevTextRef = useRef<HTMLParagraphElement>(null)
	const currTextRef = useRef<HTMLParagraphElement>(null)

	const micIndicatorRef = useRef<HTMLDivElement>(null)

	const [typingContents, setTypingContents] = useState("")
	const speakerIndicatorRef = useRef<HTMLDivElement>(null)
	const typingContainerRef = useRef<HTMLParagraphElement>(null)

	const [gameData, setGameData] = useState<GameDescriptionData>()

	useEffect(() => {
		let SRW = new SpeechRecognitionWrapper()

		gameController.dialogueNextEvent = (dialogueEntry) => {
			if (!speakerIndicatorRef.current) {
				return
			}

			// set speaker indicator
			console.log("<A>", dialogueEntry)
			const isSystem = dialogueEntry.speaker === SPEAKER_ID.System
			const isUser = dialogueEntry.speaker === SPEAKER_ID.User
			speakerIndicatorRef.current.classList.toggle("a", isSystem)
			speakerIndicatorRef.current.classList.toggle("b", isUser) // third state is when neither a nor b is present (middle)

			return
		}

		let prevAttemptContent = NBSP
		let prevAttemptDirection: "left"|"center"|"right" = "center"
		gameController.dialogueAttemptNextEvent = async (dialogueEntry, attemptEntry) => {
			if (!micIndicatorRef.current || !speakerIndicatorRef.current) {
				return
			}

			if (dialogueEntry.speaker === SPEAKER_ID.System) {
				await typeText(attemptEntry.content, speakerIndicatorRef, setTypingContents)
				
				// scroll dialogue into view simultaneously
				shiftScroll(
					shiftTextParentRef,
					{
						ref: prevTextRef,
						contents: prevAttemptContent,
						direction: prevAttemptDirection
					},
					{
						ref: currTextRef,
						contents: attemptEntry.content,
						direction: "left" // speaker is system
					})
				prevAttemptContent = attemptEntry.content // set state

				// show user speaker to prompt
				speakerIndicatorRef.current.style.display = "none"
				micIndicatorRef.current.style.display = "flex"

				// start recording session
				let start: number = +new Date();
				SRW.onStart = (recordingSession) => {
					recordingSession.updateContent = (updatedContents) => {
						console.log(`"${updatedContents}"`)
						setTypingContents(updatedContents.length === 0 ? NBSP : updatedContents)
					}

					recordingSession.end = (finalContents) => {
						// end of recording
						setTypingContents(finalContents)

						// end SRW session
						SRW.clearRecordingSession()

						// return control back to game controller
						gameController.respond(finalContents, +new Date() -start)
					}

					recordingSession.start = () => {
						// update contents
						setTypingContents(NBSP) // &nbsp; unicode
						console.log("set", NBSP)

						// hide away micIndicator
						if (!micIndicatorRef.current || !speakerIndicatorRef.current) {
							return
						}
						speakerIndicatorRef.current.style.display = "flex"
						micIndicatorRef.current.style.display = "none"

						// show speaking indicator
						speakerIndicatorRef.current.classList.toggle("a", false)
						speakerIndicatorRef.current.classList.toggle("b", true) // user is speaking
					}
				}

				SRW.start() // start speech recognition
			} else if (dialogueEntry.speaker === SPEAKER_ID.User) {
				// show pulsating text
				shiftScroll(
					shiftTextParentRef,
					{
						ref: prevTextRef,
						contents: prevAttemptContent,
						direction: prevAttemptDirection
					},
					{
						ref: currTextRef,
						contents: attemptEntry.content,
						direction: "right" // speaker is user
					})

				// switch speaker
				speakerIndicatorRef.current.classList.toggle("a", true) // system is speaking
				speakerIndicatorRef.current.classList.toggle("b", false)
				await typeText(".....", speakerIndicatorRef, setTypingContents)
			}
		}

		if (!gameController.ready) {
			// not yet registered
			gameController.register(gamesId) // only register after attaching all the event listeners
			if (!gameController.ready) {
				// failed to load game object -> unable to render game, send back home page
				return redirect("/games?_referred-by=2")
			}

			setGameData(gameController.data!)
		}

		return () => {
			// cleanup
			SRW.onStart = undefined // unset
		}
	}, [speakerIndicatorRef, typingContainerRef])

	return (
		<main className={`${GameTheme.background} text-white flex flex-col h-svh`}>
			<div className="flex flex-col items-center p-3">
				<h1 className="font-bold text-xl">{gameData?.title}</h1>
				<p>[{gameData?.subtitle}]</p>
			</div>
			<div id="world-mapper" className="grow w-full min-h-0">
				<img src={gameData?.backgroundImage} className="w-full h-full object-cover" />
			</div>
			<div className="grow flex flex-col p-3 gap-5">
				<div ref={shiftTextParentRef} id="text-bounds" className="relative overflow-y-clip grow">
					<p ref={prevTextRef} className={`text-slate-300 text-lg font-bold text-center transition-transform duration-1000`}>&nbsp;</p>
					<p ref={currTextRef} className={`absolute top-0 left-0 w-full text-slate-300 text-lg font-bold text-center translate-y-full transition-transform duration-1000`}></p>
				</div>
				<div ref={micIndicatorRef} id="mic-indicator" className="hidden flex flex-col items-center p-2">
					<p className={`${activeDialogueInFocus}`}>Please speak</p>
					<div className="w-full grow min-h-0 p-4">
						<div className="relative p-6 aspect-square w-32 mx-auto overflow-clip flex justify-center items-center rounded-full bg-white">
							<Microphone size={32} className="object-fit z-10" color="#fff" />
							<div className={`absolute top-0 left-0 w-full h-full ${GameTheme.background} rounded-full origin-center animate-[radial-grow_1s_ease-out_infinite_alternate]`}>
							</div>
						</div>
					</div>
				</div>
				<div ref={speakerIndicatorRef} id="speaking-indicator" className="group flex flex-row items-center gap-3 py-4 a justify-start [&.b]:flex-row-reverse">
					<div id="speaker-indicator" className="animate-pulse basis-1 h-full shrink-0 grow-0 group-[.a]:bg-party-a group-[.b]:bg-party-b"></div>
					<p ref={typingContainerRef} className={`group-[.b]:text-right ${activeDialogueInFocus}`}>{typingContents}</p>
				</div>
			</div>
		</main>
	)
}