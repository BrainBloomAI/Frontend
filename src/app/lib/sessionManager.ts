import "server-only"

import { JWTDecryptResult, JWTPayload, SignJWT, jwtVerify } from 'jose'
import { cookies } from "next/headers"
import { Session } from "inspector"

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

type ExtSessionPayload = SessionPayload & JWTPayload

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

export async function createSession(): Promise<SessionPayload> {
	const now = +new Date()
	const expiresAt = new Date(now +6.048e+8) // 7 days

	const sessionData = { authenticated: false, expiresAt: expiresAt }
	const session = await encrypt(sessionData)

	setCookie(session, expiresAt)
	return sessionData
}

export async function getSession() {
	const cookie = getCookie()
	if (cookie == null) {
		return
	}

	return await decrypt(cookie)
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