"use client"

import asset_01 from "@/public/games/asset_01.png"

import { Microphone } from "@phosphor-icons/react"

import { StaticImageData } from "next/image"
import { Game } from "@/app/lib/controllers/game"
import { GameDescriptionData, GameData, SPEAKER_ID, EvaluationData } from "@/app/lib/definitions"
import { redirect, useRouter } from "next/navigation"
import { Dispatch, RefObject, SetStateAction, useEffect, useReducer, useRef, useState } from "react"
import { Console } from "console"
import { SpeechRecognitionWrapper } from "@/app/lib/recognition"
import { updateSession } from "@/app/lib/sessionManager"
import config from "@/app/config"

const activeDialogueInFocus = "font-bold text-2xl text-white"
const activeDialogueOutOfFocus = "font-bold text-xl text-slate-200"

const NBSP = " " // non-breaking space for empty lines

const typeText = async (text: string, containerRef: RefObject<HTMLDivElement>, typingContentState: Dispatch<SetStateAction<string>>, emitSound: boolean = true) => {
	if (!containerRef.current) {
		return
	}

	// speech synthesis
	const synth = window.speechSynthesis;

	// clear contents
	typingContentState("")
	containerRef.current.children[0].classList.toggle("animate-pulse", true)

	// resolve promise when typing actions AND speech synthesis speaking are done
	return new Promise((resolve: (value?: undefined) => void) => {
		let pendingTyping = true
		let pendingSpeaking = !emitSound // only set to true if utterance managed to speak

		// speak
		if (emitSound) {
			if (synth.speaking) {
				synth.cancel()
			}
			console.log(synth.speaking)
			let utterance = new SpeechSynthesisUtterance(text);

			utterance.addEventListener("error", e => {
				console.log("ERROR", e)
			})
			utterance.addEventListener("start", e => {
				pendingSpeaking = true
			})
			utterance.addEventListener("end", e => {
				pendingSpeaking = false
				if (!pendingTyping) {
					// typing is done too
					resolve()
				}
			})
			synth.speak(utterance)
		}

		// type
		let charPointer = 0
		let intervalId: NodeJS.Timeout;
		intervalId = setInterval(() => {
			if (!containerRef.current) {
				return clearTimeout(intervalId)
			}

			typingContentState(text.slice(0, charPointer++))
			if (charPointer >= text.length) {
				pendingTyping = false
				if (!pendingSpeaking) {
					// speaking is done too
					resolve()
				}
				return clearTimeout(intervalId)
			}
		}, 50)
	}).then(() => {
		// stop pulsating
		containerRef.current?.children[0].classList.toggle("animate-pulse", false)
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

const scorePoints = (points: number, setState: Dispatch<SetStateAction<string>>) => {
	/**
	 * show score point over a duration of 2 seconds
	 */
	const duration = 2 *1000 // 2 seconds

	let start = +new Date() // ms
	let intervalID: NodeJS.Timeout;
	intervalID = setInterval(() => {
		let durElapsed = +new Date() -start
		let lerp = Math.min(durElapsed /duration, 1)

		let pointEarn = Math.floor(lerp *points)
		setState(`+${pointEarn}`)

		if (lerp === 1) {
			clearInterval(intervalID)
		}
	}, 100)
}

export default function GameInterface({ gamesId }: { gamesId: string }) {
	const gameController = new Game()

	const shiftTextParentRef = useRef<HTMLDivElement>(null)
	const prevTextRef = useRef<HTMLParagraphElement>(null)
	const currTextRef = useRef<HTMLParagraphElement>(null)

	const micIndicatorRef = useRef<HTMLDivElement>(null)

	const [typingContents, setTypingContents] = useState("")
	const [responseIndicatorState, setResponseIndidcatorState] = useState(0)

	const speakerIndicatorRef = useRef<HTMLDivElement>(null)
	const typingContainerRef = useRef<HTMLParagraphElement>(null)

	const [suggestedConvoResponse, setSuggestedConvoResponse] = useState<string|null>(null)

	const [gameEndedState, setGameEndedState] = useState(false)
	const [gameEarnedPoints, setGameEarnedPoints] = useState("0")
	const [evalData, setEvalData] = useState<EvaluationData>()
	const [gameData, setGameData] = useState<GameDescriptionData>()

	const router = useRouter()

	const promiseDelay = (delay: number) => {
		/**
		 * returns a Promise that resolves after waiting delay (ms) duration
		 */
		return new Promise(res => {
			setTimeout(res, delay)
		})
	}

	useEffect(() => {
		// speech recognition
		let SRW = new SpeechRecognitionWrapper()

		// game sound effects
		let bing = new Audio("/sounds/bing.mp3") // okay
		let dong = new Audio("/sounds/dong.mp3") // failed
		let beep = new Audio("/sounds/beep.mp3") // celebratory

		const startRecording = async () => {
			// show user speaker to prompt
			speakerIndicatorRef.current!.style.display = "none"
			micIndicatorRef.current!.style.display = "flex"

			// start recording session
			let start: number = +new Date();
			SRW.onStart = (recordingSession) => {
				recordingSession.updateContent = (updatedContents) => {
					setTypingContents(updatedContents.length === 0 ? NBSP : updatedContents)
				}

				recordingSession.end = (finalContents) => {
					// end of recording
					console.log("ENDED", finalContents)
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
		}

		const _inner = async() => {
			gameController.dialogueNextEvent = async (dialogueEntry, _) => {
				if (!speakerIndicatorRef.current) {
					return
				}

				// set speaker indicator
				console.log("<A>", dialogueEntry)
				const isSystem = dialogueEntry.by === SPEAKER_ID.System
				const isUser = dialogueEntry.by === SPEAKER_ID.User
				speakerIndicatorRef.current.classList.toggle("a", isSystem)
				speakerIndicatorRef.current.classList.toggle("b", isUser) // third state is when neither a nor b is present (middle)

				return
			}

			let prevAttemptContent = NBSP
			let prevAttemptDirection: "left"|"center"|"right" = "center"
			gameController.dialogueAttemptNextEvent = async (dialogueEntry, attemptEntry, hasNextDialogue) => {
				if (!micIndicatorRef.current || !speakerIndicatorRef.current) {
					return
				}

				console.log("<B>", dialogueEntry, attemptEntry)

				// hide suggested response if shown
				setSuggestedConvoResponse(null)

				// set response indicator
				setResponseIndidcatorState(0) // good

				if (dialogueEntry.by === SPEAKER_ID.System) {
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

					if (hasNextDialogue) {
						// is a playthrough
						return
					} else {
						// get user response
						startRecording()
					}
				} else if (dialogueEntry.by === SPEAKER_ID.User) {
					// show pulsating text
					if (hasNextDialogue) {
						// show typing effect since is a playthrough
						await typeText(attemptEntry.content, speakerIndicatorRef, setTypingContents)
						await promiseDelay(1000)
					} else {
						// give bing sound effect
						bing.play()
					}

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
					await typeText("..........", speakerIndicatorRef, setTypingContents, false)
				}
			}

			gameController.dialogueAttemptFailedEvent = async (dialogueEntry, attemptEntry, suggestedResponse, showSuggestedResponse) => {
				// will never be called on a playthrough
				if (showSuggestedResponse) {
					// show suggested response to help user
					setSuggestedConvoResponse(suggestedResponse)
				}

				// play failed sound effect
				dong.play()

				// set response indicator
				setResponseIndidcatorState(1) // bad
				await promiseDelay(1000)

				// let user respond again
				setResponseIndidcatorState(0)
				startRecording()
			}

			gameController.gameEndEvent = async (pointsEarned) => {
				await promiseDelay(1000)

				// play sound effect
				beep.play()

				// set state to show end screen game
				scorePoints(pointsEarned, setGameEarnedPoints)
				setGameEndedState(true)
			}

			gameController.gameEvalEvent = async (evaluation) => {
				if (evaluation) {
					setEvalData(evaluation)
				}
			}

			if (!gameController.ready) {
				// not yet registered
				await gameController.register(gamesId) // only register after attaching all the event listeners
				if (!gameController.ready) {
					// failed to load game object -> unable to render game, send back home page
					return router.push("/games?_referred-by=2")
				}

				// set game data
				setGameData(gameController.data!)

				// start game flow
				gameController.start()
			}
		}

		// invoke async function
		_inner()

		return () => {
			// cleanup
			SRW.stop()
			SRW.onStart = undefined // unset
		}
	}, [speakerIndicatorRef, typingContainerRef])

	return (
		<main className={`relative text-white flex flex-col h-svh overflow-y-clip`} style={{backgroundColor: config.GameTheme.background}}>
			<div className="flex flex-col items-center p-3">
				<h1 className="font-bold text-xl">{gameData?.title}</h1>
				<p>[{gameData?.subtitle}]</p>
			</div>
			<div id="world-mapper" className="grow relative w-full min-h-0">
				<img src={`${config.serverOrigin}/cdn/${gameData?.backgroundImage}`} className="w-full h-full object-cover" />
				<div className={`absolute top-0 left-0 w-full h-full p-4 bg-[#E17C1E] hidden opacity-0 transition-opacity`}
					style={{
						display: `${suggestedConvoResponse ? "block" : "none"}`,
						opacity: `${suggestedConvoResponse ? 1 : 0}`
					}}
				>
					<p className="text-2xl text-white pb-4">Suggested Response:</p>
					<p className="text-2xl font-bold text-white">{suggestedConvoResponse}</p>
				</div>
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
							<div className={`absolute top-0 left-0 w-full h-full rounded-full origin-center animate-[radial-grow_1s_ease-out_infinite_alternate]`} style={{backgroundColor: config.GameTheme.background}}>
							</div>
						</div>
					</div>
				</div>
				<div ref={speakerIndicatorRef} id="speaking-indicator" className="group flex flex-row items-center gap-3 py-4 a justify-start [&.b]:flex-row-reverse">
					<div id="speaker-indicator" className="animate-pulse basis-1 h-full shrink-0 grow-0 group-[.a]:bg-party-a group-[.b]:bg-party-b"></div>
					<p ref={typingContainerRef} className={`group-[.b]:text-right ${activeDialogueInFocus} transition-colors`} style={{color: config.GameTheme.responseIndicator[responseIndicatorState]}}>{typingContents}</p>
				</div>
			</div>
			<div className={`flex flex-col items-center absolute top-full left-0 w-svw h-svh transition-transform duration-1000 p-8`}
				style={{
					backgroundColor: config.GameTheme.background,
					transform: `translateY(${gameEndedState ? -100 : 0}%)`
				}}
			>
				<p className="font-bold text-2xl">Game Complete!</p>
				<p className="font-bold text-8xl p-2 mt-6">{gameEarnedPoints}</p>
				<p className="font-bold text-xl">Points Earned!</p>
				<table className="w-full grow min-h-0 overflow-auto">
					<tbody>
						{
							evalData ? ["listening", "eq", "tone", "helpfulness", "clarity"].map((metric, i) => {
								let metricKey = metric as "listening"|"eq"|"tone"|"helpfulness"|"clarity"
								return (
									<tr key={i}>
										<td className="pb-4 pr-4 align-bottom">{metric.charAt(0).toUpperCase() + metric.substr(1).toLowerCase()}</td>
										<td className="pb-4 w-full">
											<div className="flex flex-col gap-2">
												<p className="self-end">{evalData[metricKey]}</p>
												<div className="relative w-full h-4 rounded bg-slate-500 border border-slate-300 border-solid">
													<div className="absolute top-0 left-0 h-full scale-x-0 origin-left"
														style={{
															backgroundColor: "rgb(0 255 0)",
															width: `${evalData[metricKey]}%`,
															animationName: "grow-in",
															animationDelay: "1500ms",
															animationDuration: "2s",
															animationFillMode: "forwards",
															animationTimingFunction: "ease-out"
														}}>
													</div>
												</div>
											</div>
										</td>
									</tr>
								)
							}) : (
								<tr>
									<td className="pt-4">Metrics</td>
									<td className="pt-4">loading</td>
								</tr>
							)
						}
					</tbody>
				</table>
				<a className="font-bold underline text-right w-full" href="/games">Go to home</a>
			</div>
		</main>
	)
}