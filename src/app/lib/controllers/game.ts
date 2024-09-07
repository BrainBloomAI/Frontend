"use server"

/**
 * front-end wrapper to interact with backend interface
 * controls game logic (game master)
 * 
 * TWO PLAYERS
 * 	a. computer
 * 	b. user (PWIDs)
 */

enum SPEAKER_ID {
	System, // scenario computer reponse
	User // PWIDs
}

enum RESPONSE_STATUS {
	Okay,
	IMprovement,
	NotOkay
}

type AttemptEntry = {
	id: string,

	attemptNumber: number,
	content: string,
	successful: boolean

	timeTaken: number,
	dialogueId: string
}

type DialogueEntry = {
	id: string,
	speaker: SPEAKER_ID,
	successful: boolean,

	createdTimestamp: string, // iso format
	gameId: string,

	attemps: Array<AttemptEntry>
}

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

class Game {
	ready: boolean
	gameEnded: boolean

	gameId?: string
	dialogues?: Array<DialogueEntry>
	gameStartTime?: number // milliseconds, unix epoch UTC of game start time

	_dialoguePointer: number // index of current dialogue

	dialogueNextEvent?: (speakerId: SPEAKER_ID, contents: string, respStatus: RESPONSE_STATUS) => undefined

	constructor(gameId?: string) {
		this.gameId = gameId

		// states and references
		this._dialoguePointer = 0 // initial state

		if (gameId) {
			this.ready = true
			this.gameEnded = false // API, fetch game state

			this._loadDialogues()
		} else {
			this.ready = false
			this.gameEnded = false
		}
	}

	create() {
		/**
		 * invokes POST /game/create
		 * 
		 * sets this.gameId along with initialisation
		 * 
		 * will set this.ready to True if successful, otherwise remains False (default value)
		 */
		this.gameId = "GAMEID"
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
		}

		this._dialoguePointer++
		const dialogueData = this.dialogues![this._dialoguePointer] // guaranteed to exist since this.ready is true

		if (this.dialogueNextEvent) {
			this.dialogueNextEvent()
		}
	}

	start() {
		/**
		 * starts the game by initialising the game timer
		 */
		this.gameStartTime = +new Date()
	}

	respond(responseText: string, timeTaken: number): RESPONSE_STATUS {
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

		let responseTime = +new Date() // unix epoch UTC, milliseconds
		this.dialogues!.push([responseText, SPEAKER_ID.User, responseTime, responseTime -timeTaken])

		// build computer response
		let computerResponseTime = responseTime +(1 +Math.random() *1000) // introduce varying delay between 1-2s
		this.dialogues!.push(["MY REPSONSE", SPEAKER_ID.System, computerResponseTime, computerResponseTime +5000])

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