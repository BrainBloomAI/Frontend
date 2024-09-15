/**
 * Recognition wrapper that calls on the native SpeechRecognition web API for speech to text for game
 * 
 * Provides a wrapper around the native SpeechRecognition object
 */

"use client"

import { useEffect } from "react"

type RecordingSession = {
	updateContent?: (updatedContents: string) => void, // speech on-going updates
	start?: () => void, // speech start
	end?: (finalCOntents: string) => void, // speech end

	_lastContent?: string,
	_id?: number // unique ID attached to session, generated by +new Date()
}

enum SRWState {
	Running,
	Stop
}

export class SpeechRecognitionWrapper {
	sr: SpeechRecognition

	state: SRWState
	currentRecordingSession: RecordingSession

	onStart?: (recordingSession: RecordingSession) => void
	onEmptyResponse?: () => void

	constructor() {
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
		const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
		const SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

		// speech recognition instantiate and setup
		this.sr = new SpeechRecognition()
		this.sr.continuous = false
		this.sr.interimResults = true
		this.sr.lang = "en-US"

		// set state
		this.state = SRWState.Stop

		// memory object
		this.currentRecordingSession = {}

		// attach events
		this.sr.onresult = e => {
			let resultList = e.results
			let singleResult = resultList[0] // at position 0
			let optimalResult = singleResult[0] // first alternative
			console.log("result", singleResult)

			// update content
			this.currentRecordingSession._lastContent = optimalResult.transcript

			// determine action
			if (singleResult.isFinal) {
				console.log("FINAL", this.currentRecordingSession)
				// final one
				if (this.currentRecordingSession.end) {
					console.log("FIRING")
					this.currentRecordingSession.end(optimalResult.transcript) // .stop() will cleanup session, finish session job first
					this.stop()
				}
			} else {
				if (this.currentRecordingSession.updateContent) {
					this.currentRecordingSession.updateContent(optimalResult.transcript)
				}
			}
		}

		this.sr.onerror = (e) => {
			console.log("WHAT IS YOUR ERROR")
			console.log(e.error)
		}

		this.sr.addEventListener("speechstart", e => {
			console.log("INNER SPEECH START")
			if (this.currentRecordingSession.start) {
				this.currentRecordingSession.start()
			}
			this.currentRecordingSession._lastContent = ""
		})

		this.sr.addEventListener("speechend", e => {
			console.log("INNER SPEECH END")
			if (this.currentRecordingSession.end) {
				// has a recording session going on
				// this.stop() // let onresult fire this.stop upon receiving a result with .isFinal set to true
			}

			let id = this.currentRecordingSession._id
			if (id) {
				setTimeout(() => {
					if (this.currentRecordingSession._id === id && this.state === SRWState.Running) {
						// still running, manually stop

						// determine content
						let cont = this.currentRecordingSession._lastContent ?? ""

						if (this.currentRecordingSession.end) {
							this.currentRecordingSession.end(cont)
						}

						console.log("POST STATE", this.state)
						if (cont.length === 0 && this.onEmptyResponse) {
							// response is empty, and restart event is hooked
							this.abort() // abort immediately
							setTimeout(() => this.onEmptyResponse!(), 100)
						} else {
							this.stop()
						}
					}
				}, 100)
			}
		})
	}

	clearRecordingSession() {
		/**
		 * clears the recording session to prevent any more firing of events
		 */
		this.currentRecordingSession = {}
	}

	start() {
		this.sr.start()
		this.state = SRWState.Running
		console.log("started")
		if (this.onStart) {
			this.currentRecordingSession = {
				_id: +new Date()
			} // clear session
			this.onStart(this.currentRecordingSession) // pass by memory
		}
	}

	abort() {
		console.log(this.state)
		if (this.state === SRWState.Running) {
			this.sr.abort() // stop SpeechRecognition object

			// set state
			this.state = SRWState.Stop

			// clear session
			this.currentRecordingSession = {}
		}
	}

	stop() {
		console.log(this.state)
		if (this.state === SRWState.Running) {
			this.sr.stop() // stop SpeechRecognition object

			// set state
			this.state = SRWState.Stop

			// clear session
			this.currentRecordingSession = {}
		}
	}
}