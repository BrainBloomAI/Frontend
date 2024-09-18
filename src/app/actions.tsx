"use server"

import { OnboardFormSchema, LoginFormSchema, SignupFormSchema, LoginFormState, SignupFormState, MindsEvalFormState, ScenarioFormState, ProfileData, ExtProfileData, ScenarioFormSchema, ScenarioData } from "@/app/lib/definitions"
import { createSession, getSession } from "@/app/lib/sessionManager"
import { downgradeSession, upgradeSession } from "@/app/lib/dataAccessLayer"
import { redirect, RedirectType } from "next/navigation"

import { GameData } from "@/app/lib/definitions"
import { AxiosRequestConfig, AxiosResponse } from "axios"
import { Game } from "./lib/controllers/game"
import { Console } from "console"
import { reportWebVitals } from "next/dist/build/templates/pages"

export async function updateMindsEvaluation(state: MindsEvalFormState, formData: FormData) {
	const validatedFields = OnboardFormSchema.safeParse({
		listening: formData.get("listening"),
		eq: formData.get("eq"),
		tone: formData.get("tone"),
		helpfulness: formData.get("helpfulness"),
		clarity: formData.get("clarity"),
		assessment: formData.get("assessment"),
	})

	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
		}
	}

	const { listening, eq, tone, helpfulness, clarity, assessment } = validatedFields.data

	let session = await getSession()
	if (!session || session.authenticated === false) {
		// not authenticated
		return {
			message: "Not authenticated"
		}
	}

	const clientID = formData.get("clientIDLookup")

	// get targetUsername from userId
	let clientData: ProfileData|undefined = await session.bridge.get(`/staff/view/${clientID}`)
		.then(r => {
			return r.data
		}).catch((err: any) => {
			return
		})

	if (clientData == null) {
		return {
			message: "Failed to lookup clientID"
		}
	}

	let errorMessage: string | null = null;
	const response = await session.bridge
		.post("/staff/updateMindsEvaluation", {
			targetUsername: clientData.username, listening, eq, tone, helpfulness, clarity, assessment
		})
		.then((r) => {
			if (r.status === 200) {
				return r.data;
			}

			throw new Error("updateMindsEvaluation() caught response")
		})
		.catch((err) => {
			if (err.status === 400) {
				errorMessage = "Invalid data provided";
			}
			return;
		});

	if (response) {
		// Successful update, handle redirection or success feedback
		redirect(`/clients/view/${clientID}`)
	} else {
		// Failed update, handle errors
		return {
			message: errorMessage ?? "Failed to communicate with server (11)"
		}
	}
}

export async function login(state: LoginFormState, formData: FormData) {
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
		console.log("UPGRADED SESSION", session, await getSession())

		// redirect user
		return redirect("/")
	} else {
		return {
			message: errorMessage ?? "Failed to communicate with server (1)"
		}
	}
}

export async function signup(state: SignupFormState, formData: FormData) {
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

export async function staffSignup(state: SignupFormState, formData: FormData) {
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
		role: "staff"
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
		await downgradeSession() // downgrade regardless whether server revoke token, as client expects to log out from session
		console.log("downgrading")

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

export async function isStaff() {
	let session = await getSession()
	if (!session || session.authenticated === false) {
		// not authenticated
		return false
	}

	let errorMessage: string|undefined;
	const response: ProfileData = await session.bridge.get("/identity")
		.then((r: AxiosResponse & { data: ProfileData }) => {
			if (r.status === 200) {
				return r.data
			}

			throw new Error(`FAILED: Caught status in isStaff(), ${r.status}`)
		}).catch((err: any) => { // TODO: err is Erroobject and r.status
			// server failed to respond
			if (err.response) {
				errorMessage = err.response.data.split(": ")[1]
			}
			console.warn("isStaff() failed to obtain a response, will fail")
		})

	return response && response.role === "staff"
}


export async function getScenarioList() {
	let session = await getSession()
	console.log("\n\n\n\n.getScenarioList()", session)
	if (!session || session.authenticated === false) {
		// not authenticated
		return
	}

	const scenarioList: Array<ScenarioData>|undefined = await session.bridge.get("/game/scenarios").then(async r => {
		if (r.status === 200) {
			console.log("returned")
			return r.data
		}

		return Promise.reject(-1)
	}).catch(async err => { // TODO: FIX TYPECAST
		// server failed to respond
		console.warn("getScenarioList() failed to obtain a response, will silently fail", err)
		redirect("/logout") // logout of current session
	})

	console.log("service end", await getSession())
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

export async function getAllGameData() {
	/**
	 * gets user's games throughout lifetime with respective evaluation data from server
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
	let params = {
		includeEvaluation: true
	}
	const gameData: GameData|undefined = await session.bridge.get("/game",
		{ params } as AxiosRequestConfig & { params: { includeScenario?: true, includeDialogues?: true, includeEvaluation?: true }}
	).then((r: AxiosResponse & { data: GameData }) => {
		if (r.status === 200) {
			return r.data
		}

		throw new Error(`FAILED: Caught status in getAllGameData(), ${r.status}`)
	}).catch((err: any) => { // TODO: err is Erroobject and r.status
		// server failed to respond
		if (err.response) {
			errorMessage = err.response.data.split(": ")[1]
		}
		console.warn("getAllGameGame() failed to obtain a response, will fail", err)
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
			message: errorMessage ?? "Failed to communicate with server (31)"
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

export async function getProfileData() {
	let session = await getSession()
	if (!session || session.authenticated === false) {
		// not authenticated
		return {
			success: false,
			message: "Not authenticated"
		}
	}

	let errorMessage: string|undefined;
	const response: ExtProfileData = await session.bridge.get("/identity")
		.then((r: AxiosResponse & { data: ProfileData }) => {
			if (r.status === 200) {
				return r.data
			}

			throw new Error(`FAILED: Caught status in getProfileData(), ${r.status}`)
		}).catch((err: any) => { // TODO: err is Erroobject and r.status
			// server failed to respond
			if (err.response) {
				errorMessage = err.response.data.split(": ")[1]
			}
			console.warn("getProfileData() failed to obtain a response, will fail", err)
		})

	if (response) {
		const gameDataResponse: Array<GameData> = await session.bridge.get("/game", { params: { includeScenario: true, includeEvaluation: true }})
			.then((r: AxiosResponse & { data: Array<GameData> }) => {
				if (r.status === 200) {
					return r.data
				}

				throw new Error(`FAILED: Caught status in getProfileData() -2, ${r.status}`)
			}).catch((err: any) => {
				if (err.response) {
					errorMessage = err.response.data.split(": ")[1]
				}
				console.warn("getProfileData() failed to obtain a response, will fail")
			})

		if (gameDataResponse) {
			response.games = gameDataResponse

			return {
				success: true,
				data: response
			}
		}

		return {
			success: false,
			message: "Unable to fetch lifetime game data"
		}
	} else {
		console.log("FAILED", errorMessage)
		return {
			success: false,
			message: errorMessage ?? "Failed to communicate with server (6)"
		}
	}
}

export async function getAllClients() {
	let session = await getSession()
	if (!session || session.authenticated === false) {
		// not authenticated
		return {
			success: false,
			message: "Not authenticated"
		}
	}

	let errorMessage: string|undefined;
	const response: Array<ProfileData> = await session.bridge.get("/staff/viewClients")
		.then((r: AxiosResponse & { data: Array<ProfileData> }) => {
			if (r.status === 200) {
				return r.data
			}

			throw new Error(`FAILED: Caught status in getAllClients(), ${r.status}`)
		}).catch((err: any) => { // TODO: err is Erroobject and r.status
			// server failed to respond
			if (err.response) {
				errorMessage = err.response.data.split(": ")[1]
			}
			console.warn("getAllClients() failed to obtain a response, will fail")
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
			message: errorMessage ?? "Failed to communicate with server (22)"
		}
	}
}

export async function getClientData(clientID: string) {
	let session = await getSession()
	if (!session || session.authenticated === false) {
		// not authenticated
		return {
			success: false,
			message: "Not authenticated"
		}
	}

	let errorMessage: string|undefined;
	const response: ExtProfileData = await session.bridge.get(`/staff/view/${clientID}`)
		.then((r: AxiosResponse & { data: ProfileData }) => {
			if (r.status === 200) {
				return r.data
			}

			throw new Error(`FAILED: Caught status in getClientData(), ${r.status}`)
		}).catch((err: any) => { // TODO: err is Erroobject and r.status
			// server failed to respond
			if (err.response) {
				errorMessage = err.response.data.split(": ")[1]
			}
			console.warn("getClientData() failed to obtain a response, will fail", err)
		})

	if (response) {
		const gameDataResponse: Array<GameData> = await session.bridge.get("/game", { params: { targetUsername: response.username, includeScenario: true, includeEvaluation: true }})
			.then((r: AxiosResponse & { data: Array<GameData> }) => {
				if (r.status === 200) {
					return r.data
				}

				throw new Error(`FAILED: Caught status in getClientData() -2, ${r.status}`)
			}).catch((err: any) => {
				if (err.response) {
					errorMessage = err.response.data.split(": ")[1]
				}
				console.warn("getClientData() failed to obtain a response, will fail")
			})

		if (gameDataResponse) {
			response.games = gameDataResponse

			return {
				success: true,
				data: response
			}
		}

		return {
			success: false,
			message: "Unable to fetch lifetime game data"
		}
	} else {
		console.log("FAILED", errorMessage)
		return {
			success: false,
			message: errorMessage ?? "Failed to communicate with server (6)"
		}
	}
}

export async function createNewScenario(state: ScenarioFormState, formData: FormData) {
	const validatedFields = ScenarioFormSchema.safeParse({
		name: formData.get("name"),
		description: formData.get("description"),
		modelRole: formData.get("modelRole"),
		userRole: formData.get("userRole"),
	})
 
	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
		}
	}

	let session = await getSession()
	if (session == null) {
		session = await createSession()
	}

	let errorMessage: string|null = null;
	console.log("SENDING", formData, typeof formData)
	const createdScenario = await session.bridge.post("/scenario/new", formData, {
		headers: { "Content-Type": "multipart/form-data" }
	}).then((r: AxiosResponse) => {
		if (r.status === 200) {
			return r.data
		}

		throw new Error(`FAILED: Uncaught response code, ${r.status}`)
	}).catch((err: any) => {
		if (err.status === 404 || err.status === 401) {
			errorMessage = err.response.data
		}
		return
	})

	console.log("RETURNED", createdScenario)
	if (createdScenario && createdScenario.newScenario) {
		// redirect user
		return redirect("/scenarios")
	} else {
		return {
			message: errorMessage ?? "Failed to communicate with server (14)"
		}
	}
}

export async function deleteScenario(scenarioID: string) {
	let session = await getSession()
	if (!session || session.authenticated === false) {
		// not authenticated
		return {
			success: false,
			message: "Not authenticated"
		}
	}

	let errorMessage: string|null = null;
	const deletedScenario = await session.bridge.post("/scenario/delete", { scenarioID })
		.then((r: AxiosResponse) => {
			if (r.status === 200) {
				return true
			}

			throw new Error(`FAILED: Uncaught response code, ${r.status}`)
		}).catch((err: any) => {
			if (err.status === 404 || err.status === 401) {
				errorMessage = err.response.data
			}

			console.log(err)
			return false
		})

	console.log("RETURNED", deletedScenario)
	if (deletedScenario) {
		// redirect user
		return redirect("/scenarios")
	} else {
		console.log(errorMessage)
		return {
			message: errorMessage ?? "Failed to communicate with server (14)"
		}
	}
}