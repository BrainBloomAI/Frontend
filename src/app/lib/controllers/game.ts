"use client"

import { getGameData, newDialogue } from "@/app/actions"
import { SPEAKER_ID, RESPONSE_STATUS, AttemptEntry, DialogueEntry, GameData, GameDescriptionData } from "@/app/lib/definitions"

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

	gameID?: string
	dialogues?: Array<DialogueEntry>
	data?: GameDescriptionData

	_dialoguePointer: number // index of current dialogue

	dialogueNextEvent?: (dialogueEntry: DialogueEntry, hasNextDialogue: boolean) => void|Promise<void> // fired whenever new dialogue appears
	dialogueAttemptNextEvent?: (dialogueEntry: DialogueEntry, attemptEntry: AttemptEntry, hasNextDialogue: boolean) => void|Promise<void> // fired whenever new attempt appears (first attempt fires immediately right after dialogue gets created)
	dialogueAttemptFailedEvent?: (DialogueEntry: DialogueEntry, attemptEntry: AttemptEntry, suggestedResponse: string) => void|Promise<void> // fired when user made an attempt but not accurate

	constructor() {
		// states and references
		this._dialoguePointer = -1 // initial state

		this.ready = false
		this.gameEnded = false
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
				title: gameData.scenario.name,
				subtitle: gameData.scenario.userRole,
				backgroundImage: gameData.scenario.backgroundImage
			}

			// set states
			this.ready = true
			this.gameEnded = gameData.status !== "ongoing"

			this.dialogues = gameData.dialogues
			this._dialoguePointer = -1
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

		for (let i = 0; i < this.dialogues!.length; i++) {
			await this._loadNext()
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
		const dialogueData = this.dialogues![this._dialoguePointer] // guaranteed to exist since this.ready is true
		const hasNextDialogue = this.gameEnded || this._dialoguePointer <= this.dialogues!.length -2

		if (this.dialogueNextEvent) {
			await this.dialogueNextEvent(dialogueData, hasNextDialogue)
		}
		if (this.dialogueAttemptNextEvent) {
			if (this.gameEnded) {
				// is a playthrough
				// TODO: only pass in dialogueData.attempts[dialogueData.attemptsCount -1] -> successful attempt
			}
			await this.dialogueAttemptNextEvent(dialogueData, dialogueData.attempts[0], hasNextDialogue)
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
			throw new GameEndedError(`Trying to invoke controller.reespond, however this.gameEnded = ${this.gameEnded}`)
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
				}, attemptData, responseData.suggestedAIResponse)
			}
		}

		return 0
	}
}