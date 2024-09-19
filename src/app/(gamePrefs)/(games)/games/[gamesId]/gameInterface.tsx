"use client"

import asset_01 from "@/public/games/asset_01.png"

import { Microphone, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react"

import { StaticImageData } from "next/image"
import { Game } from "@/app/lib/controllers/game"
import { GameDescriptionData, GameData, SPEAKER_ID, EvaluationData, GamePreferences } from "@/app/lib/definitions"
import { redirect, useRouter } from "next/navigation"
import { Dispatch, Fragment, RefObject, SetStateAction, useEffect, useReducer, useRef, useState } from "react"
import { Console } from "console"
import { Recorder } from "@/app/lib/recognition"
import { updateSession } from "@/app/lib/sessionManager"
import config from "@/app/config"
import { synthesis, translateText } from "@/app/actions"

const activeDialogueInFocus = "font-bold text-2xl text-white"
const activeDialogueOutOfFocus = "font-bold text-xl text-slate-200"

const NBSP = " " // non-breaking space for empty lines
let globalPrefs: GamePreferences; // to be set when main component renders

const speakText = (text: string, speaker: 0|1) => {
	/**
	 * text to speech streamed with mediasource and played via audio object
	 */
	const audio = new Audio()
	const mediaSource = new MediaSource()

	// return promise chain
	let resolverFn: (value?: unknown) => void
	let p = new Promise(res => {
		resolverFn = res
	})

	audio.addEventListener("ended", () => {
		resolverFn()
	})

	audio.src = URL.createObjectURL(mediaSource)
	audio.play().catch(err => {
		resolverFn() // no audio -> resolve promise to continue game
	})

	console.log("INVOKED SO FAST", globalPrefs)
	mediaSource.addEventListener("sourceopen", async () => {
		console.log("SOURCE OPENED")

		if (globalPrefs.lang === 0) {
			const sourceBuffer = mediaSource.addSourceBuffer("audio/aac")
			const readableStream = await fetch(`${config.speechServiceSynthesisProtocol}://${config.speechServiceURL}/${config.speechServiceSynthesisNamespace}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ text, speaker })
			}).then(r => {
				console.log("STREAM RETURNED", r.body)
				return r.body
			})
			if (!readableStream) {
				// invalid response supplied
				return
			}

			const reader = readableStream.getReader()
			console.log("reader", reader)
			const pushToBuffer = async () => {
				console.log("Pushing")
				const { done, value } = await reader.read()
				console.log("reading", value)
				if (done) {
					mediaSource.endOfStream()
					return
				}

				if (!sourceBuffer.updating) {
					sourceBuffer.appendBuffer(value)
				}
			}

			sourceBuffer.addEventListener("updateend", pushToBuffer)
			pushToBuffer() // initial update
		} else {
			// utilise google synthesiser for other languages
			const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg")
			let synthResult = await synthesis(text, globalPrefs.lang)
			if (!synthResult) {
				// failed
				return resolverFn() // resolve returned promise as no sound will play
			}

			synthResult = new Uint8Array(synthResult)
			sourceBuffer.addEventListener("updateend", () => mediaSource.endOfStream())
			sourceBuffer.appendBuffer(synthResult.buffer)
		}
	})

	mediaSource.addEventListener("error", e => {
		console.log("Mediasource error")
		resolverFn() // immediately resolve promise
	})

	return p
}

const typeText = async (text: string, containerRef: RefObject<HTMLDivElement>, typingContentState: Dispatch<SetStateAction<string>>, emitSound: boolean = true, speaker: 0|1 = 0) => {
	if (!containerRef.current) {
		return
	}

	// clear contents
	typingContentState("")
	containerRef.current.children[0].classList.toggle("animate-pulse", true)

	// resolve promise when typing actions AND speech synthesis speaking are done
	return new Promise((resolve: (value?: undefined) => void) => {
		let pendingTyping = true
		let pendingSpeaking = emitSound // only set to true if utterance managed to speak

		// speak
		if (emitSound) {
			speakText(text, speaker).then(() => {
				// finished
				pendingSpeaking = false // no longer pending

				if (!pendingTyping) {
					// typing is done too
					resolve()
				}
			})
		}

		// type
		let charPointer = 0
		let intervalId: NodeJS.Timeout;
		intervalId = setInterval(() => {
			if (!containerRef.current) {
				return clearTimeout(intervalId)
			}

			typingContentState(text.slice(0, charPointer++))
			if (charPointer >= text.length +1) {
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

const scorePoints = (points: number, setState: Dispatch<SetStateAction<string|null>>) => {
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

export default function GameInterface({ gamesId, prefs }: { gamesId: string, prefs: GamePreferences }) {
	const gameController = new Game(prefs)
	globalPrefs = Object.assign({}, prefs) // set global

	const shiftTextParentRef = useRef<HTMLDivElement>(null)
	const prevTextRef = useRef<HTMLParagraphElement>(null)
	const currTextRef = useRef<HTMLParagraphElement>(null)

	const micIndicatorRef = useRef<HTMLDivElement>(null)

	const [typingContents, setTypingContents] = useState("")
	const [responseIndicatorState, setResponseIndidcatorState] = useState(0)

	const speakerIndicatorRef = useRef<HTMLDivElement>(null)
	const typingContainerRef = useRef<HTMLParagraphElement>(null)

	const [suggestedConvoResponse, setSuggestedConvoResponse] = useState<string|null>(null)
	const [suggestedConvoResponseIsSpeaking, setSuggestedConvoResponseIsSpeaking] = useState(true)

	const [gameEndedState, setGameEndedState] = useState(false)
	const [gameEarnedPoints, setGameEarnedPoints] = useState<string|null>("0")
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

	const localiseTextDict: { [key: string]: string } = {} // cache of translations
	const localiseText = (text: string) => {
		if (prefs.lang === 0) {
			return text
		} else {
			if (localiseTextDict[text]) {
				return localiseTextDict[text]
			}

			return translateText(text, prefs.lang)
		}
	}

	// recorder states
	const [recorderObj, setRecorderObj] = useState<Recorder>()
	const [isRecording, setIsRecording] = useState(false);

	// socket states
	const [isConnected, setIsConnected] = useState(false);
	const [transport, setTransport] = useState("N/A");


	const startRecording = () => {
		if (recorderObj) {
			// is in recording phase
			recorderObj.startRecording()
		}
	}

	const stopRecording = () => {
		if (recorderObj) {
			// is in recording phase
			recorderObj.stopRecording()
		}
	}

	useEffect(() => {
		/**
		 * main render cycle to instantiate Recorder object
		 */
		let SR = new Recorder({
			isRecording, setIsRecording,
			isConnected, setIsConnected,
			socketURL: `${config.speechServiceRecongitionProtocol}://${config.speechServiceURL}/${config.speechServiceRecognitionNamespace}`,
			prefs
		})
		setRecorderObj(SR) // store in state for reference by DOM
	}, [prefs])

	useEffect(() => {
		if (!recorderObj) {
			// no changes
			return
		}

		// game sound effects
		let bing = new Audio("/sounds/bing.mp3") // okay
		let dong = new Audio("/sounds/dong.mp3") // failed
		let beep = new Audio("/sounds/beep.mp3") // celebratory

		const startRecordingPhase = async () => {
			// show user speaker to prompt
			speakerIndicatorRef.current!.style.display = "none"
			micIndicatorRef.current!.style.display = "flex"

			// start recording session
			let start: number = +new Date();
			const session = await recorderObj.createSession()
			console.log("SESSION CREATED")

			session.onResult = (updatedContents) => {
				// hide away micIndicator
				if (!micIndicatorRef.current || !speakerIndicatorRef.current) {
					return
				}

				speakerIndicatorRef.current.style.display = "flex"
				micIndicatorRef.current.style.display = "none"

				// show speaking indicator
				speakerIndicatorRef.current.classList.toggle("a", false)
				speakerIndicatorRef.current.classList.toggle("b", true) // user is speaking

				setTypingContents(updatedContents.length === 0 ? NBSP : updatedContents)
			}

			session.onEnd = (finalContents, duration) => {
				// end of recording
				if (finalContents.length === 0) {
					// empty response
					return
				}

				// hide away micIndicator
				if (!micIndicatorRef.current || !speakerIndicatorRef.current) {
					return
				}

				speakerIndicatorRef.current.style.display = "flex"
				micIndicatorRef.current.style.display = "none"

				// show speaking indicator
				speakerIndicatorRef.current.classList.toggle("a", false)
				speakerIndicatorRef.current.classList.toggle("b", true) // user is speaking

				// force typing contents to final one instead
				console.log("ENDED", finalContents, duration)
				setTypingContents(finalContents)

				// end recording session
				recorderObj.clearSession()

				// return control back to game controller
				gameController.respond(finalContents, duration *1000) // convert seconds to milliseconds
			}

			startRecording()
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
					await typeText(await localiseText(attemptEntry.content), speakerIndicatorRef, setTypingContents, true, 0)
					
					// scroll dialogue into view simultaneously
					shiftScroll(
						shiftTextParentRef,
						{
							ref: prevTextRef,
							contents: await localiseText(prevAttemptContent),
							direction: prevAttemptDirection
						},
						{
							ref: currTextRef,
							contents: await localiseText(attemptEntry.content),
							direction: "left" // speaker is system
						})
					prevAttemptContent = attemptEntry.content // set state

					if (hasNextDialogue) {
						// is a playthrough
						return
					} else {
						// get user response
						startRecordingPhase()
					}
				} else if (dialogueEntry.by === SPEAKER_ID.User) {
					// show pulsating text
					if (hasNextDialogue) {
						// show typing effect since is a playthrough
						await typeText(await localiseText(attemptEntry.content), speakerIndicatorRef, setTypingContents, true, 1)
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

			gameController.dialogueAttemptFailedEvent = async (dialogueEntry, attemptEntry, suggestedResponse, showSuggestedResponse, typeResponse) => {
				// will never be called on a playthrough
				if (showSuggestedResponse) {
					// show suggested response to help user
					setSuggestedConvoResponse(await localiseText(suggestedResponse))
				}

				// set contents
				if (typeResponse) {
					await typeText(await localiseText(attemptEntry.content), speakerIndicatorRef, setTypingContents, true, 1)
				}

				// play failed sound effect
				dong.play()

				// set response indicator
				setResponseIndidcatorState(1) // bad
				await promiseDelay(1000)

				// let user respond again
				setResponseIndidcatorState(0)
				startRecordingPhase()
			}

			gameController.gameEndEvent = async (pointsEarned) => {
				await promiseDelay(1000)

				// play sound effect
				beep.play()

				// set state to show end screen game
				if (pointsEarned === -1) {
					// no data yet
					setGameEarnedPoints(null)
					setGameEndedState(true)
				} else {
					scorePoints(pointsEarned, setGameEarnedPoints)
					setGameEndedState(true)
				}
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
				if (prefs.lang !== 0) {
					gameController.data!.title = await localiseText(gameController.data!.title)
					gameController.data!.subtitle = await localiseText(gameController.data!.subtitle)
				}
				setGameData(gameController.data!)

				// start game flow
				gameController.start()
			}
		}

		// invoke async function
		_inner()

		return () => {
			// cleanup
			recorderObj.cleanup()
		}
	}, [recorderObj, speakerIndicatorRef, typingContainerRef])

	let suggestConvoResponseSpeakingChannel = 0
	useEffect(() => {
		if (!suggestedConvoResponseIsSpeaking || !suggestedConvoResponse) {
			// either not speaking or suggestedConvoResponse is empty (unset action)
			return
		}

		let _cid = ++suggestConvoResponseSpeakingChannel
		setTimeout(() => {
			if (_cid === suggestConvoResponseSpeakingChannel) {
				speakText(suggestedConvoResponse, 1)
			}
		}, 500) // play guidance statement 500ms later if still relevant
	}, [suggestedConvoResponse, suggestedConvoResponseIsSpeaking])

	return (
		<main className={`relative text-white flex flex-col h-svh overflow-y-clip`} style={{backgroundColor: config.GameTheme.background}}>
			<div className="flex flex-row gap-4 p-3 items-start">
				<a href="/abandon" className="p-2 rounded bg-[rgb(255_45_45)] font-bold text-white">{["Abandon", "退出"][prefs.lang]}</a>
				<div className="grow flex flex-col items-center">
					<h1 className="font-bold text-xl">{gameData?.title}</h1>
					<p>[{gameData?.subtitle}]</p>
				</div>
			</div>
			<div id="world-mapper" className="grow relative w-full min-h-0">
				<img src={`${config.serverOrigin}/cdn/${gameData?.backgroundImage}`} className="w-full h-full object-cover" />
				<div className={`absolute top-0 left-0 w-full h-full flex flex-col p-4 bg-[#E17C1E] hidden opacity-0 transition-opacity`}
					style={{
						display: `${suggestedConvoResponse ? "flex" : "none"}`,
						opacity: `${suggestedConvoResponse ? 1 : 0}`
					}}
				>
					<p className="text-2xl text-white pb-4">{["Recommendation:", "試看："][prefs.lang]}</p>
					<p className="text-2xl font-bold text-white grow">{suggestedConvoResponse}</p>
					<button className="self-end" onClick={() => setSuggestedConvoResponseIsSpeaking(!suggestedConvoResponseIsSpeaking)}>
						{
							suggestedConvoResponseIsSpeaking ? <SpeakerHigh size={32} /> : <SpeakerSlash size={32} />
						}
					</button>
				</div>
			</div>
			<div className="flex flex-col p-3 gap-5">
				<div ref={shiftTextParentRef} id="text-bounds" className="relative overflow-y-clip grow">
					<p ref={prevTextRef} className={`text-slate-300 text-lg font-bold text-center transition-transform duration-1000`}>&nbsp;</p>
					<p ref={currTextRef} className={`absolute top-0 left-0 w-full text-slate-300 text-lg font-bold text-center translate-y-full transition-transform duration-1000`}></p>
				</div>
				<div ref={micIndicatorRef} id="mic-indicator" className="hidden flex flex-col items-center p-2">
					<p className={`${activeDialogueInFocus}`}>{["Please speak", "請説"][prefs.lang]}</p>
					<div className="w-full grow min-h-0 p-4">
						<button className="relative p-6 aspect-square w-32 mx-auto flex justify-center items-center rounded-full bg-white"
							onClick={() => {
								if (isRecording) {
									stopRecording()
								} else {
									startRecording()
								}
							}}
						>
							<Microphone size={32} className="object-fit z-10" color="#fff" />
							<div className={`absolute top-0 left-0 w-full h-full rounded-full origin-center animate-[radial-grow_1s_ease-out_infinite_alternate]`} style={{backgroundColor: config.GameTheme.background}}>
							</div>
							<div className="absolute bottom-0 left-full h-3 w-3 rounded-full z-10 transition-colors" style={{
								backgroundColor: isRecording ? "#32a852" : "#ff0000"
							}}>
							</div>
						</button>
					</div>
				</div>
				<div ref={speakerIndicatorRef} id="speaking-indicator" className="group flex flex-row items-center gap-3 py-4 a justify-start [&.b]:flex-row-reverse">
					<div id="speaker-indicator" className="animate-pulse basis-1 h-full shrink-0 grow-0 group-[.a]:bg-party-a group-[.b]:bg-party-b"></div>
					<p ref={typingContainerRef} className={`group-[.b]:text-right ${activeDialogueInFocus} transition-colors`} style={{color: config.GameTheme.responseIndicator[responseIndicatorState]}}>{typingContents}</p>
				</div>
			</div>
			<div className={`flex flex-col items-center absolute top-full left-0 w-svw h-svh transition-transform duration-1000 p-4 md:p-8`}
				style={{
					backgroundColor: config.GameTheme.background,
					transform: `translateY(${gameEndedState ? -100 : 0}%)`
				}}
			>
				<p className="font-bold text-2xl">Game Complete!</p>
				<p className="font-bold text-8xl p-2 mt-6">{gameEarnedPoints != null ? gameEarnedPoints : "??"}</p>
				<p className="font-bold text-xl grow">{gameEarnedPoints != null ? "Points Earned!" : "Please view this game again from your profile page"}</p>
				{ evalData && (
					<>
						<p className="font-bold pb-2">Assessment</p>
						<p className="text-sm">{evalData.simpleDescription ?? ""}</p>
					</>
				)}
				<div className="grid gap-x-4 gap-y-2 items-end w-full my-4 min-h-0 overflow-auto" style={{
					gridTemplateColumns: "min-content auto"
				}}>
					{
						evalData ? ["listening", "eq", "tone", "helpfulness", "clarity"].map((metric, i) => {
							let metricKey = metric as "listening"|"eq"|"tone"|"helpfulness"|"clarity"
							return (
								<Fragment key={i}>
								<p className="align-bottom text-sm font-bold w-min">{metric.charAt(0).toUpperCase() + metric.substr(1).toLowerCase()}</p>
								<div className="flex flex-col gap-2 pb-1 grow">
									<p className="self-end">{evalData[metricKey]}</p>
									<div className="relative w-full h-2 rounded bg-slate-500">
										<div className="absolute top-0 left-0 h-full scale-x-0 rounded origin-left"
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
								</Fragment>
							)
						}) : (
							<div>
								<p className="pt-4">Evaluating responses...</p>
							</div>
						)
					}
				</div>
				<a className="font-bold underline text-right w-full" href="/games">Go to home</a>
			</div>
		</main>
	)
}