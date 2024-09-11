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

	dialogueNextEvent?: (dialogueEntry: DialogueEntry) => void|Promise<void> // fired whenever new dialogue appears
	dialogueAttemptNextEvent?: (dialogueEntry: DialogueEntry, attemptEntry: AttemptEntry) => void|Promise<void> // fired whenever new attempt appears (first attempt fires immediately right after dialogue gets created)

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
		if (gameDataPayload.success) {
			const gameData = gameDataPayload.data!

			// set data
			this.data = {
				title: gameData.scenarioData.name,
				subtitle: gameData.scenarioData.userRole,
				backgroundImage: gameData.scenarioData.backgroundImage
			}

			// set states
			this.ready = true
			this.gameEnded = gameData.status !== "ongoing"

			this.dialogues = gameData.dialogues // HERE
			this._dialoguePointer = -1

			for (let i = 0; i < this.dialogues.length; i++) {
				this._loadNext()
			}
		} else {
			// failed
			this.ready = false
		}

		return this // for chaining
	}

	create() {
		/**
		 * invokes POST /game/create
		 * 
		 * sets this.gameID along with initialisation
		 * 
		 * will set this.ready to True if successful, otherwise remains False (default value)
		 */
		this.gameID = "GAMEID"
		this.dialogues = []

		this.ready = true
	}

	_loadDialogues(playthrough: boolean = true) {
		/**
		 * playthrough: boolean, if true will sequence the dialogues in an animated fashion, otherwise jumps to the most recent dialogue
		 * 
		 * loads the sequeunce of dialogues
		 */
	}

	_loadNext() {
		/**
		 * increments ._dialoguePointer and triggers sequences for next event
		 * 
		 * 1. dispatch event attached to .dialogueNextEvent
		 */
		if (this.ready == null) {
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

		if (this.dialogueNextEvent) {
			this.dialogueNextEvent(dialogueData)
		}
		if (this.dialogueAttemptNextEvent) {
			this.dialogueAttemptNextEvent(dialogueData, dialogueData.attempts[0])
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
		if (this.ready === false) {
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
		if ('aiResponse' in responseData) {
			// success
			this.dialogues!.push({
				id: "-", // placeholder ID since not important
				speaker: SPEAKER_ID.User,
				successful: true,

				createdTimestamp: new Date().toISOString(),
				gameID: this.gameID!,

				attempts: [{
					id: "-", // placeholder ID since not important

					attemptNumber: 1,
					content: responseText,
					successful: true,

					timeTaken: timeTakenS, // convert it to seconds
					dialogueId: "-"
				}]
			})

			// fire event
			this._loadNext()

			// push system response
			this.dialogues!.push({
				id: responseData.aiResponse.dialogueID, // placeholder ID since not important
				speaker: SPEAKER_ID.System,
				successful: true,

				createdTimestamp: responseData.aiResponse.createdAt,
				gameID: this.gameID!,

				attempts: [{
					id: responseData.aiResponse.attemptID, // placeholder ID since not important

					attemptNumber: responseData.aiResponse.attemptNumber,
					content: responseData.aiResponse.content,
					successful: true,

					timeTaken: responseData.aiResponse.timeTaken, // convert it to seconds
					dialogueId: responseData.aiResponse.dialogueID
				}]
			})
		}

		return 0
	}

	getResponse(): string {
		/**
		 * get computer player response to user's response
		 * invoked right after this.respond
		 * 
		 * returns string, the next prompt
		 */

		// the computer response is built immediately into this.dialogues by this.respond()
		return this.dialogues![this.dialogues!.length -1][0]
	}
}