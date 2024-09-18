"use client"

import { getGameData, newDialogue } from "@/app/actions"
import { SPEAKER_ID, RESPONSE_STATUS, AttemptEntry, DialogueEntry, GameData, GameDescriptionData, EvaluationData, GamePreferences } from "@/app/lib/definitions"

/**
 * front-end wrapper to interact with backend interface
 * controls game logic (game master)
 * 
 * TWO PLAYERS
 * 	a. computer
 * 	b. user (PWIDs)
 */
class GameError extends Error {
	constructor(msg: string) {
		super(msg)

		Object.setPrototypeOf(this, GameError.prototype) // set prototype explicity
	}
}

class GameNotReadyError extends GameError {
}

class GameEndedError extends GameError {
}

export class Game {
	ready: boolean
	gameEnded: boolean

	prefs: GamePreferences

	gameID?: string
	dialogues?: Array<DialogueEntry>
	data?: GameDescriptionData
	pointsEarned?: number

	_dialoguePointer: number // index of current dialogue
	_currDialogueAttempts: number // incremental index to keep track number of failed attempts for current dialogue

	dialogueNextEvent?: (dialogueEntry: DialogueEntry, hasNextDialogue: boolean) => void|Promise<void> // fired whenever new dialogue appears
	dialogueAttemptNextEvent?: (dialogueEntry: DialogueEntry, attemptEntry: AttemptEntry, hasNextDialogue: boolean) => void|Promise<void> // fired whenever new attempt appears (first attempt fires immediately right after dialogue gets created)
	dialogueAttemptFailedEvent?: (DialogueEntry: DialogueEntry, attemptEntry: AttemptEntry, suggestedResponse: string, showSuggestedResponse: boolean, typeResponse: boolean) => void|Promise<void> // fired when user made an attempt but not accurate (never fired on playthroughs)

	gameEndEvent?: (addedScore: number) => void // fired when game ended (will be fired for playthroughs too)
	gameEvalEvent?: (evaluation?: EvaluationData) => void // fired after game ended and evaluation metrics are available (will be fired for playthroughs too, immediately)

	constructor(prefs: GamePreferences) {
		// states and references
		this._dialoguePointer = -1 // initial state
		this._currDialogueAttempts = 0

		this.ready = false
		this.gameEnded = false

		this.prefs = prefs
	}

	async register(gameID: string) {
		/**
		 * registers this game object with the gameID
		 * will load data related to gameID if user has access to it (controlled by backend)
		 */
		this.gameID = gameID

		const gameDataPayload = await getGameData(gameID)
		console.log("\n\n\n\nPAYLOAD", gameDataPayload)
		if (gameDataPayload.success === true) {
			const gameData = gameDataPayload.data!

			// set data
			this.data = {
				title: gameData.scenario!.name,
				subtitle: gameData.scenario!.userRole,
				backgroundImage: gameData.scenario!.backgroundImage
			}

			// set states
			this.ready = true
			this.gameEnded = gameData.status !== "ongoing"

			this.dialogues = gameData.dialogues
			this._dialoguePointer = -1
			this._currDialogueAttempts = 0

			if (this.ready) {
				this.pointsEarned = gameData.pointsEarned
			}
		} else {
			// failed
			this.ready = false
		}

		return this // for chaining
	}

	async start() {
		/**
		 * starts iterating through conversation chain once registered
		 */
		if (!this.ready) {
			// not ready
			throw new GameNotReadyError(`Trying to invoke controller.start, however this.ready = ${this.ready}`)
		}
		if (this._dialoguePointer >= this.dialogues!.length -1) {
			// out of range
			// throw error
			throw new GameError(`Trying to invoke controller.start, however this._dialoguePointer exceeds this.dialogues.length, this._dialoguePointer = ${this._dialoguePointer}`)
		}

		const showEndScreen = this.gameEnded
		for (let i = 0; i < this.dialogues!.length; i++) {
			console.log("loading", i)
			await this._loadNext()
		}

		if (showEndScreen && this.gameEndEvent) {
			this.endGame()
		}
	}

	async _loadNext() {
		/**
		 * increments ._dialoguePointer and triggers sequences for next event
		 * 
		 * 1. dispatch event attached to .dialogueNextEvent
		 */
		if (!this.ready) {
			// not ready
			throw new GameNotReadyError(`Trying to invoke controller._loadNext, however this.ready = ${this.ready}`)
		}
		if (this._dialoguePointer >= this.dialogues!.length -1) {
			// out of range
			// throw error
			throw new GameError(`Trying to invoke controller._loadNext, however this._dialoguePointer exceeds this.dialogues.length, this._dialoguePointer = ${this._dialoguePointer}`)
		}

		this._dialoguePointer++
		this._currDialogueAttempts = 0
		const dialogueData = this.dialogues![this._dialoguePointer] // guaranteed to exist since this.ready is true
		const hasNextDialogue = this.gameEnded || this._dialoguePointer <= this.dialogues!.length -2

		if (this.dialogueNextEvent) {
			await this.dialogueNextEvent(dialogueData, hasNextDialogue)
		}
		if (this.dialogueAttemptNextEvent) {
			if (hasNextDialogue) {
				// is a playthrough, only pass in successful attempt
				let successfulIdx = 0 // find index of successful attempt within dialogueData.attempts
				for (let i = 0; i < dialogueData.attempts.length; i++) {
					if (dialogueData.attempts[i].successful === true) {
						successfulIdx = i
						break
					}
				}
				await this.dialogueAttemptNextEvent(dialogueData, dialogueData.attempts[successfulIdx], hasNextDialogue)
				console.log("RETURNED")
			} else {
				if (!dialogueData.successful) {
					if (this.dialogueAttemptFailedEvent) {
						await this.dialogueAttemptFailedEvent(dialogueData, dialogueData.attempts[dialogueData.attemptsCount -1], "", false, true) // no suggested text
					}
				} else {
					await this.dialogueAttemptNextEvent(dialogueData, dialogueData.attempts[0], hasNextDialogue)
				}
			}
		}
	}

	async endGame() {
		// game ended
		this.gameEnded = true

		// fire event
		console.log("CHECKING GAME END EVENT")
		if (this.gameEndEvent) {
			if (this.pointsEarned) {
				this.gameEndEvent(this.pointsEarned)
			} else {
				// not provided somehow
				console.warn("WARNING: .pointsEarned not set when calling .endGame()")
				this.gameEndEvent(-1)
			}
		}

		console.log("CHECKING GAME DATA", this.gameEvalEvent)
		if (this.gameEvalEvent) {
			const gameDataPayload = await getGameData(this.gameID!)
			console.log("GOT GAME DATA", gameDataPayload)
			if (!gameDataPayload.success) {
				this.gameEvalEvent() // failed, send empty payload
				return 0
			}

			const gameData = gameDataPayload.data!
			if (!gameData.evaluation) {
				this.gameEvalEvent() // failed, send empty payload
				return 0
			}

			this.gameEvalEvent(gameData.evaluation)
		}
	}

	async respond(responseText: string, timeTaken: number): Promise<RESPONSE_STATUS> {
		/**
		 * responseText: string, user response to prompt
		 * timeTaken: number, milliseconds it took user to complete the prompt (speech converted to text)
		 * 
		 * player response to prompt
		 * get computer response
		 * 
		 * throws a GameNotReadyError if .ready === false
		 * throws a GameEndedError if .ended === true
		 * 
		 * returns RESPONSE_STATUS
		 */
		if (!this.ready) {
			// controller is not ready
			throw new GameNotReadyError(`Trying to invoke controller.respond, however this.ready = ${this.ready}`)
		}
		if (this.gameEnded === true) {
			throw new GameEndedError(`Trying to invoke controller.respond, however this.gameEnded = ${this.gameEnded}`)
		}
		if (responseText.length === 0) {
			// empty response

			// build attempt
			const attemptData = {
				attemptID: "-", // placeholder ID since not important

				dialogueId: "-",
				attemptNumber: 1,

				content: responseText,
				successful: true,

				timeTaken: 0,
				timestamp: new Date().toISOString()
			}

			if (this.dialogueAttemptFailedEvent) {
				this.dialogueAttemptFailedEvent({
					dialogueID: "-", // placeholder ID since not important
					by: SPEAKER_ID.User,

					attemptsCount: 1,
					successful: true,

					createdTimestamp: new Date().toISOString(),
					gameID: this.gameID!,

					attempts: [attemptData]
				}, attemptData, "Try speaking something.", this._currDialogueAttempts >= 2, false) // last arg: no need type contents as content has been updated by speech
			}
			return 0
		}

		let timeTakenS = timeTaken /1000 // convert it to seconds

		let responsePayload = await newDialogue(responseText, timeTakenS) // convert it to seconds
		if (!responsePayload.success) {
			throw new GameError("Failed to invoke inner API")
		}

		const responseData = responsePayload.data
		if ("aiResponse" in responseData) {
			// success

			// build user dialogue data first
			this.dialogues!.push({
				dialogueID: "-", // placeholder ID since not important
				by: SPEAKER_ID.User,

				attemptsCount: 1,
				successful: true,

				createdTimestamp: new Date().toISOString(),
				gameID: this.gameID!,

				attempts: [{
					attemptID: "-", // placeholder ID since not important

					dialogueId: "-",
					attemptNumber: 1,

					content: responseText,
					successful: true,

					timeTaken: timeTakenS, // convert it to seconds
					timestamp: new Date().toISOString()
				}]
			})

			// fire event
			this._loadNext()

			// push system response
			this.dialogues!.push({
				dialogueID: responseData.aiResponse.dialogueID, // placeholder ID since not important
				by: SPEAKER_ID.System,

				attemptsCount: 1,
				successful: true,

				createdTimestamp: responseData.aiResponse.createdAt,
				gameID: this.gameID!,

				attempts: [{
					attemptID: responseData.aiResponse.attemptID, // placeholder ID since not important

					dialogueId: responseData.aiResponse.dialogueID,
					attemptNumber: responseData.aiResponse.attemptNumber,
					content: responseData.aiResponse.content,
					successful: true,

					timeTaken: responseData.aiResponse.timeTaken, // convert it to seconds
					timestamp: new Date().toISOString()
				}]
			})

			// fire event
			this._loadNext()
		} else if ("suggestedAIResponse" in responseData) {
			// user response can be better
			this._currDialogueAttempts++

			// build attempt
			const attemptData = {
				attemptID: "-", // placeholder ID since not important

				dialogueId: "-",
				attemptNumber: 1,

				content: responseText,
				successful: true,

				timeTaken: timeTakenS, // convert it to seconds
				timestamp: new Date().toISOString()
			}

			if (this.dialogueAttemptFailedEvent) {
				this.dialogueAttemptFailedEvent({
					dialogueID: "-", // placeholder ID since not important
					by: SPEAKER_ID.User,

					attemptsCount: 1,
					successful: true,

					createdTimestamp: new Date().toISOString(),
					gameID: this.gameID!,

					attempts: [attemptData]
				}, attemptData, responseData.suggestedAIResponse, this._currDialogueAttempts >= 2, false)
			}
		} else {
			if ("pointsEarned" in responseData) {
				// set data
				this.pointsEarned = responseData.pointsEarned
			}

			// start sequence
			this.endGame()
		}

		return 0
	}
}