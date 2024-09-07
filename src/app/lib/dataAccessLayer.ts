import 'server-only'
 
import { createSession, decrypt, getSession } from '@/app/lib/sessionManager'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { redirect } from 'next/navigation'

export const upgradeSession = async (authToken: string) => {
	/**
	 * authenticate the current session with supplied authToken
	 * upgrade session privileges
	 * 
	 * returns nothing
	 */
	let session = await getSession()
	if (session == null) {
		// get new session
		session = await createSession()
	}

	session.authenticated = true
	session._authTokenValidDuration = 1.08e+7 // 3 hours
	session._authTokenFetchTime = +new Date()
	session.authToken = authToken
}

export const authenticateSession = async (creds: { username: string, password: string}): Promise<boolean> => {
	/**
	 * authenticate session with supplied username and password
	 * 
	 * returns true if authentication successful, otherwise false
	 */
	let session = await getSession()
	if (session == null) {
		// get new session
		session = await createSession()
	}

	// authenticate username and password
	if (creds.username && creds.password) {
		// valid
		const authToken = "ABC" // API (if not able to get auth token, return false)
		await upgradeSession(authToken) // upgrade session privileges

		return true
	} else {
		return false
	}
}

export const verifySession = cache(async () => {
	const cookie = cookies().get('session')?.value
	const session = await decrypt(cookie)
 
	if (session == null) {
		return
	}
	if (!session?.authToken) {
		let authToken = session.authToken

		// validate authToken with backend
		redirect('/login')
	}
 
	return { isAuth: true, userId: session.userId }
})