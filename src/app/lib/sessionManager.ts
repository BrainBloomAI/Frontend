import "server-only"

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from "next/headers"
import axios, { AxiosInstance } from "axios"

const SECRET_KEY = process.env.SECRET_KEY
const encodedSecretKey = new TextEncoder().encode(SECRET_KEY)

const SESSION_COOKIE_NAME = "session"

type SessionPayload = {
	authenticated: boolean,
	expiresAt: Date
	authToken?: string,
	_authTokenFetchTime?: number, // UTC unix epoch (ms)
	_authTokenValidDuration?: number, // milliseconds
}

type ExtSessionPayload = SessionPayload & {
	bridge: AxiosInstance
}

// TODO: move bridge logic to its own separate file
const BRIDGE_CONFIG = {
	baseURL: "http://localhost:8000",
	authTokenHeaderKeyName: "authtoken",
}

function createBridge(authToken?: string, _retrievedAt?: number, _authTokenValidDuration?: number) {
	/**
	 * authToken: string, supplied authToken to be passed into header of every call
	 * _retrievedAt: number, unix epoch in milliseconds when authToken was granted (must be present if authToken is supplied)
	 * _authTokenValidDuration: number, number of milliseconds authToken is valid for after point of grant (must be present if authToken is supplied)
	 * 
	 * returns an AxiosInstance for HTTP requests to backend
	 */
	const inst = axios.create({
		baseURL: BRIDGE_CONFIG.baseURL,
		timeout: 1000,
		headers: {
			[BRIDGE_CONFIG.authTokenHeaderKeyName]: authToken
		}
	})

	if (authToken && _retrievedAt && _authTokenValidDuration) {
		inst.interceptors.request.use((config: any) => {
			const controller = new AbortController()

			if (+new Date() -_retrievedAt >= _authTokenValidDuration -600000) {
				// 10 minutes before expiry -> get new token
				const refreshedToken = axios({
					method: "POST",
					url: `${BRIDGE_CONFIG.baseURL}/identity/refreshSession`,
					headers: {
						authtoken: authToken // lowercase headers
					}
				}).then((r: Response & { data: string }) => {
					if (r.status === 200) {
						return r.data.slice(-10) // extract token
					}

					throw new Error(`Unhandled error, ${r.status}`)
				}).catch((err: any) => {
					console.warn("FAILED: Unable to refresh authToken with err", err)
				})

				if (refreshedToken) {
					// managed to obtain a valid refresh token
					inst.defaults.headers[BRIDGE_CONFIG.authTokenHeaderKeyName] = refreshedToken
				} else {
					// not able to refresh token, abort request
					controller.abort()
				}
			}

			return {
				...config,
				signal: controller.signal
			}
		})
	} else if (authToken) {
		console.warn("WARN: Bridge created with authToken, but token parameters were never passed")
	}

	return inst
}

export async function encrypt(payload: SessionPayload) {
	return new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(encodedSecretKey)
}

export async function decrypt(session: string|undefined = ""): Promise<(SessionPayload|null)> {
	try {
		const verified = await jwtVerify(session, encodedSecretKey, {
			algorithms: ["HS256"]
		})
		const payload = verified.payload as SessionPayload

		return payload
	} catch (error) {
		console.log("Failed to verify session")
		return null
	}
}

export function getCookie() {
	return cookies().get(SESSION_COOKIE_NAME)?.value
}

export async function setCookie(session: string, expires: Date) {
	/**
	 * session: string, return value of encrypt() (i.e. JWT's encrypted token)
	 */
	cookies().set(SESSION_COOKIE_NAME, session, {
		httpOnly: true,
		secure: true,
		expires: expires,
		sameSite: "lax",
		path: "/"
	})
}

export async function createSession(): Promise<ExtSessionPayload> {
	const now = +new Date()
	const expiresAt = new Date(now +6.048e+8) // 7 days

	const sessionData = { authenticated: false, expiresAt: expiresAt } as ExtSessionPayload
	const session = await encrypt(sessionData)

	setCookie(session, expiresAt)

	// extends session data to include bridge
	sessionData.bridge = createBridge()
	return sessionData
}

export async function getSession(): Promise<ExtSessionPayload|undefined> {
	const cookie = getCookie()
	if (cookie == null) {
		return
	}

	const sessionData = await decrypt(cookie) as ExtSessionPayload
	if (sessionData == null) {
		return
	}

	sessionData.bridge = createBridge(sessionData.authToken)
	return sessionData
}

export async function overwriteSession(session: ExtSessionPayload) {
	const { bridge, ...strippedSession } = session

	const encrypted = await encrypt(strippedSession)
	setCookie(encrypted, session.expiresAt)
}

export async function updateSession() {
	let session = cookies().get(SESSION_COOKIE_NAME)?.value
	const payload = await decrypt(session)

	if (!session || !payload) {
		return null
	}

	const expires = new Date(+new Date() +6.048e+8)
	payload.expiresAt = expires
	setCookie(await encrypt(payload), expires)
}