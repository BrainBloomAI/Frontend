"use server"

import { LoginFormSchema, SignupFormSchema, FormState, ScenarioEntry } from "@/app/lib/definitions"
import { createSession, getSession } from "@/app/lib/sessionManager"
import { upgradeSession } from "@/app/lib/dataAccessLayer"
import { redirect } from "next/navigation"

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
	}).then(r => {
		if (r.status === 200) {
			return r.data.slice(-10)
		} else {
			return Promise.reject(r.status)
		}
	}).catch(err => {
		if (err.status === 404 || err.status === 401) {
			errorMessage = err.response.data
		}
		return
	})

	if (authToken) {
		// managed to obtain authToken
		upgradeSession(authToken)

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
	}).then(r => {
		if (r.status === 200) {
			return r.data.slice(-10)
		} else {
			return Promise.reject(r.status)
		}
	}).catch(err => {
		if (err.status === 400) {
			errorMessage = err.response.data
		}
		return
	})

	if (authToken) {
		// managed to obtain authToken
		upgradeSession(authToken)

		// redirect user
		return redirect("/games")
	} else {
		return {
			message: errorMessage ?? "Failed to communicate with server (2)"
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

	const scenarioList: Array<ScenarioEntry>|undefined = await session.bridge.get("/game/scenarios").then(r => {
		if (r.status === 200) {
			return r.data.map(async (entry: ScenarioEntry) => {
				// convert backgroundImage to blob
				entry.backgroundImage = await fetch(`${session.bridge.defaults.baseURL}/public/img/${entry.backgroundImage}`)
					.then(r => {
						if (r.status === 20) {
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
						return "https://cdn-icons-png.flaticon.com/512/3593/3593455.png" // default placeholder
					})
			})
		}
	}).catch(err => {
		// server failed to respond
		console.warn("getScenarioList() failed to obtain a response, will silently fail")
	})

	return scenarioList
}