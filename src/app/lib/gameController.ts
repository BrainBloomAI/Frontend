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
	Computer, // scenario computer reponse
	User // PWIDs
}

enum RESPONSE_STATUS {
	Okay,
	IMprovement,
	NotOkay
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
	dialogues?: Array<[string, 0|1, number, number]>
	gameStartTime?: number // milliseconds, unix epoch UTC of game start time

	constructor(gameId?: string) {
		this.gameId = gameId
		this.ready = false
		this.gameEnded = false
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
		this.dialogues = [
			["Hello", 0, 0, 0],
			["Welcome", 0, 0.34, 2.4]
		]

		this.ready = true
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
		 * throws a
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
		this.dialogues!.push(["MY REPSONSE", SPEAKER_ID.Computer, computerResponseTime, computerResponseTime +5000])

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