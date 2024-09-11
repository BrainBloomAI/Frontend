/**
 * Synthesis text to speech for game
 * 
 * Provides a wrapper around the native SpeechRecognition object
 */

"use client"

import { useEffect } from "react"

type RecordingSession = {
	updateContent?: (updatedContents: string) => void, // speech on-going updates
	start?: () => void, // speech start
	end?: (finalCOntents: string) => void // speech end
}


export class SpeechRecognitionWrapper {
	sr: SpeechRecognition

	currentRecordingSession: RecordingSession
	onStart?: (recordingSession: RecordingSession) => void

	constructor() {
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
		const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
		const SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

		// speech recognition instantiate and setup
		this.sr = new SpeechRecognition()
		this.sr.continuous = true
		this.sr.interimResults = true

		// memory object
		this.currentRecordingSession = {}

		// attach events
		this.sr.addEventListener("result", e => {
			console.log("e", e)
			let resultList = e.results
			let singleResult = resultList[0] // at position 0
			let optimalResult = singleResult[0] // first alternative

			if (singleResult.isFinal) {
				// final one
				if (this.currentRecordingSession.end) {
					this.currentRecordingSession.end(optimalResult.transcript)
				}
			} else {
				if (this.currentRecordingSession.updateContent) {
					this.currentRecordingSession.updateContent(optimalResult.transcript)
				}
			}
		})

		this.sr.onerror = (e) => {
			console.log(e.error)
		}

		this.sr.addEventListener("speechstart", e => {
			if (this.currentRecordingSession.start) {
				this.currentRecordingSession.start()
			}
		})

		this.sr.addEventListener("speechend", e => {
			if (this.currentRecordingSession.end) {
				// has a recording session going on
				this.stop()
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
		console.log("started")
		if (this.onStart) {
			this.currentRecordingSession = {}
			this.onStart(this.currentRecordingSession) // pass by memory
		}
	}

	abort() {
		this.sr.abort()
	}

	stop() {
		if (this.currentRecordingSession.end) {
			this.sr.stop() // stop the object
		}
	}
}