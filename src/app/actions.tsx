"use server"

import { LoginFormSchema, SignupFormSchema, FormState, ScenarioEntry } from "@/app/lib/definitions"
import { createSession, getSession } from "@/app/lib/sessionManager"
import { downgradeSession, upgradeSession } from "@/app/lib/dataAccessLayer"
import { redirect } from "next/navigation"

import { GameData } from "@/app/lib/definitions"
import { AxiosRequestConfig, AxiosResponse } from "axios"
import { Game } from "./lib/controllers/game"
import { Console } from "console"

export async function login(state: FormState, formData: FormData) {
	const validatedFields = LoginFormSchema.safeParse({
		name: formData.get("name"),
		password: formData.get("password"),
	})
 
	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
		}
	}

	const { name, password } = validatedFields.data
	let session = await getSession()
	if (session == null) {
		session = await createSession()
	}

	let errorMessage: string|null = null;
	const authToken = await session.bridge.post("/identity/login", {
		username: name,
		password
	}).then((r: AxiosResponse) => {
		if (r.status === 200) {
			return r.data.slice(-10)
		}

		throw new Error(`FAILED: Uncaught response code, ${r.status}`)
	}).catch((err: any) => {
		if (err.status === 404 || err.status === 401) {
			errorMessage = err.response.data
		}
		return
	})

	if (authToken) {
		// managed to obtain authToken
		await upgradeSession(authToken) // wait for session to upgrade before redirecting user to a privilege-required page

		// redirect user
		return redirect("/games")
	} else {
		return {
			message: errorMessage ?? "Failed to communicate with server (1)"
		}
	}
}

export async function signup(state: FormState, formData: FormData) {
	const validatedFields = SignupFormSchema.safeParse({
		name: formData.get("name"),
		email: formData.get("email"),
		password: formData.get("password"),
		confirmPassword: formData.get("confirmPassword")
	})
 
	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
		}
	}

	const { name, email, password } = validatedFields.data
	let session = await getSession()
	if (session == null) {
		session = await createSession()
	}

	let errorMessage: string|null = null;
	const authToken = await session.bridge.post("/identity/new", {
		username: name,
		email,
		password,
		role: "standard"
	}).then((r: AxiosResponse) => {
		if (r.status === 200) {
			return r.data.slice(-10)
		}

		throw new Error(`FAILED: Uncaught response code, ${r.status}`)
	}).catch((err: any) => { // TODO: FIX
		if (err.status === 400) {
			errorMessage = err.response.data
		}
		return
	})

	if (authToken) {
		// managed to obtain authToken
		await upgradeSession(authToken) // wait for session to upgrade before redirecting user to a privilege-required page

		// redirect user
		return redirect("/games")
	} else {
		return {
			message: errorMessage ?? "Failed to communicate with server (2)"
		}
	}
}

export async function logout() {
	/**
	 * logouts of current session
	 */
	let session = await getSession()
	console.log('session?', session)
	if (!session || session.authenticated === false) {
		// not authenticated
		return {
			success: false,
			message: "Not authenticated"
		}
	}

	let errorMessage: string|undefined;
	const loggedOut = await session.bridge.post("/identity/logout")
		.then((r: AxiosResponse & { data: { gameID: string }}) => {
			if (r.status === 200) {
				return true
			}

			throw new Error(`FAILED: Caught status in logout(), ${r.status}`)
		}).catch((err: any) => { // TODO: err is Erroobject and r.status
			// server failed to respond
			if (err.response) {
				if (err.response.status === 401) {
					// rejected auth token --> same effects as token being revoked
					return true
				}

				// fail to revoke token
				errorMessage = err.response.data.split(": ")[1]
			}
			console.warn("logout() failed to obtain a response, will fail!!")

			return false
		})

	console.log("\n\n\nLOGGEDOUT:", loggedOut)
	if (loggedOut) {
		console.log("downgrading")
		await downgradeSession()

		return {
			success: true
		}
	} else {
		console.log("FAILED TO LOGOUT", errorMessage)
		return {
			success: false,
			message: errorMessage ?? "Failed to communicate with server (21)"
		}
	}
}

export async function isAuthenticated() {
	let session = await getSession()
	return session && session.authenticated
}


export async function getScenarioList() {
	let session = await getSession()
	if (!session || session.authenticated === false) {
		// not authenticated
		return
	}

	const scenarioList: Array<ScenarioEntry>|undefined = await session.bridge.get("/game/scenarios").then(async r => {
		if (r.status === 200) {
			const updatedEntries = await Promise.all(
				r.data.map(async (entry: ScenarioEntry) => {
					// convert backgroundImage to blob
					console.log("fetching", `${session.bridge.defaults.baseURL}/public/img/${entry.backgroundImage}`)
					entry.backgroundImage = await fetch(`${session.bridge.defaults.baseURL}/public/img/${entry.backgroundImage}`)
						.then(r => {
							console.log("r.status", r.status)
							if (r.status === 200) {
								return r.blob()
							}

							return Promise.reject(r.status)
						}).then(blob => {
							return new Promise((res: (dataURL: string) => void, rej) => {
								const reader = new FileReader()
								reader.onload = _ => {
									res(reader.result as string)
								}
								reader.onerror = err => {
									rej(reader.error)
								}

								reader.readAsDataURL(blob)
							})
						}).catch(err => {
							console.log("rejected")
							return "https://cdn-icons-png.flaticon.com/512/3593/3593455.png" // default placeholder
						})

					console.log(`updated: ${entry.backgroundImage}`)
					return entry
				})
			)

			console.log("returned")
			return r.data
		}

		return Promise.reject(-1)
	}).catch(err => { // TODO: FIX TYPECAST
		// server failed to respond
		console.warn("getScenarioList() failed to obtain a response, will silently fail", err)
	})

	return scenarioList
}

export async function abandonGame() {
	/**
	 * abandons current active game
	 */
	let session = await getSession()
	if (!session || session.authenticated === false) {
		// not authenticated
		return {
			success: false,
			message: "Not authenticated"
		}
	}

	let errorMessage: string|undefined;
	const gameID = await session.bridge.post("/game/abandon")
		.then((r: AxiosResponse & { data: { gameID: string }}) => {
			if (r.status === 200) {
				return true
			}

			throw new Error(`FAILED: Caught status in abandonGame(), ${r.status}`)
		}).catch((err: any) => { // TODO: err is Erroobject and r.status
			// server failed to respond
			if (err.response) {
				errorMessage = err.response.data.split(": ")[1]
			}
			console.warn("abandonGame() failed to obtain a response, will fail", err)

			return false
		})

	if (gameID) {
		redirect(`/games`)
		return {
			success: true
		}
	} else {
		console.log("FAILED", errorMessage)
		return {
			success: false,
			message: errorMessage ?? "Failed to communicate with server (3)"
		}
	}
}

export async function createNewGame(scenarioID: string) {
	/**
	 * creates a new game with the supplied scenarioID
	 */
	let session = await getSession()
	if (!session || session.authenticated === false) {
		// not authenticated
		return {
			success: false,
			message: "Not authenticated"
		}
	}

	let errorMessage: string|undefined;
	const gameID: string|undefined = await session.bridge.post("/game/new", {
		scenarioID
	}).then((r: AxiosResponse & { data: { gameID: string }}) => {
		if (r.status === 200) {
			return r.data.gameID
		}

		throw new Error(`FAILED: Caught status in createNewGame(), ${r.status}`)
	}).catch((err: any) => { // TODO: err is Erroobject and r.status
		// server failed to respond
		if (err.response) {
			errorMessage = err.response.data.split(": ")[1]
		}
		console.warn("createNewGame() failed to obtain a response, will fail!!", err)
	})

	console.log("\n\n.createNewGame() returned gameID:", gameID)
	if (gameID) {
		return {
			success: true,
			gameID
		}
	} else {
		console.log("FAILED", errorMessage)
		return {
			success: false,
			message: errorMessage ?? "Failed to communicate with server (3)"
		}
	}
}

export async function getGameData(gameID: string) {
	/**
	 * gets gameData from server based on gameID
	 */
	let session = await getSession()
	if (!session || session.authenticated === false) {
		// not authenticated
		return {
			success: false,
			message: "Not authenticated"
		}
	}

	console.log("\n\n\n\n\tFETCHING:", gameID)
	let errorMessage: string|undefined;
	let params = {
		gameID,
		includeScenario: true,
		includeDialogues: true,
		includeEvaluation: true
	}
	const gameData: GameData|undefined = await session.bridge.get("/game",
		{ params } as AxiosRequestConfig & { params: { gameID: string, includeScenario?: true, includeDialogues?: true, includeEvaluation?: true }}
	).then((r: AxiosResponse & { data: GameData }) => {
		if (r.status === 200) {
			return r.data
		}

		throw new Error(`FAILED: Caught status in getGameData(), ${r.status}`)
	}).catch((err: any) => { // TODO: err is Erroobject and r.status
		// server failed to respond
		if (err.response) {
			errorMessage = err.response.data.split(": ")[1]
		}
		console.warn("getGameGame() failed to obtain a response, will fail", err)
	})

	console.log("\n\n\n\nreturned payload!!\n", gameData)
	if (gameData) {
		return {
			success: true,
			data: gameData
		}
	} else {
		console.log("FAILED", errorMessage)
		return {
			success: false,
			message: errorMessage ?? "Failed to communicate with server (3)"
		}
	}
}


type NewDialogueBackendResponse = {
	message: string,
	suggestedAIResponse: string
} | {
	message: string,
	aiResponse: {
		attemptID: string,
		dialogueID: string,
		attemptNumber: number,
		content: string,
		successful: boolean,
		timestamp: string, // ISO format
		timeTaken: number, // seconds
		updatedAt: string, // ISO format
		createdAt: string // ISO format
	}
} | {
	message: string,
	pointsEarned: number
	feedback: string
} | {
	message: string
}

export async function newDialogue(content: string, timeTaken: number): Promise<{success: true, data: NewDialogueBackendResponse}|{success: false, message: string}> {
	/**
	 * content: string,
	 * timeTaken: number, seconds
	 */
	let session = await getSession()
	if (!session || session.authenticated === false) {
		// not authenticated
		return {
			success: false,
			message: "Not authenticated"
		}
	}

	let errorMessage: string|undefined;
	const response: NewDialogueBackendResponse = await session.bridge.post("/game/newDialogue", {
		content, timeTaken
	}).then((r: AxiosResponse & { data: GameData }) => {
		if (r.status === 200) {
			return r.data
		}

		throw new Error(`FAILED: Caught status in newDialogue(), ${r.status}`)
	}).catch((err: any) => { // TODO: err is Erroobject and r.status
		// server failed to respond
		if (err.response) {
			errorMessage = err.response.data.split(": ")[1]
		}
		console.warn("newDialogue() failed to obtain a response, will fail")
	})

	if (response) {
		return {
			success: true,
			data: response
		}
	} else {
		console.log("FAILED", errorMessage)
		return {
			success: false,
			message: errorMessage ?? "Failed to communicate with server (4)"
		}
	}
}




export async function updateMindsEvaluation(state: any, formData: any) {
	// Validate the fields, assuming the necessary validation schema is set up.
	const validatedFields = {
		targetUsername: formData.get("targetUsername"),
		listening: parseFloat(formData.get("listening")) || 0,
		eq: parseFloat(formData.get("eq")) || 0,
		tone: parseFloat(formData.get("tone")) || 0,
		helpfulness: parseFloat(formData.get("helpfulness")) || 0,
		clarity: parseFloat(formData.get("clarity")) || 0,
		assessment: formData.get("assessment"),
	}

	if (!validatedFields.targetUsername || !validatedFields.assessment) {
		// Return errors if required fields are missing
		return {
			errors: { general: "All fields are required!" },
		}
	}

	let session = await getSession()
	if (!session || session.authenticated === false) {
		// not authenticated
		return {
			success: false,
			message: "Not authenticated"
		}
	}

	let errorMessage: string | null = null;

	// Post request to update the evaluation
	const response = await session.bridge
		.post("/staff/updateMindsEvaluation", {
			targetUsername: validatedFields.targetUsername,
			listening: validatedFields.listening,
			eq: validatedFields.eq,
			tone: validatedFields.tone,
			helpfulness: validatedFields.helpfulness,
			clarity: validatedFields.clarity,
			assessment: validatedFields.assessment,
		})
		.then((r) => {
			if (r.status === 200) {
				return r.data;
			} else {
				return Promise.reject(r.status);
			}
		})
		.catch((err) => {
			if (err.status === 400) {
				errorMessage = "Invalid data provided";
			}
			return;
		});

	if (response) {
		// Successful update, handle redirection or success feedback
		return { message: "Evaluation successfully updated!" };
	} else {
		// Failed update, handle errors
		return { message: errorMessage || "Failed to update evaluation" };
	}
}
