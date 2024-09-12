import 'server-only'
 
import { createSession, decrypt, getSession, overwriteSession } from '@/app/lib/sessionManager'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { redirect } from 'next/navigation'

export const upgradeSession = async (authToken: string) => {
	/**
	 * authenticate the current session with supplied authToken
	 * upgrade session privileges
	 * 
	 * returns void
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

	// update expire timings
	session.expiresAt = new Date(+new Date() +6.048e+8)

	console.log("authenticated session", session)

	// overwrite cookie session
	await overwriteSession(session)

	return session
}

export const downgradeSession = async () => {
	/**
	 * removes authentication from current session
	 * 
	 * returns void
	 */
	let session = await getSession()
	if (session == null) {
		// get new session
		session = await createSession() // no authentication
		return
	}

	session.authenticated = false
	session._authTokenValidDuration = undefined // unset
	session._authTokenFetchTime = undefined
	session.authToken = undefined

	// update expire timings
	session.expiresAt = new Date(+new Date() +6.048e+8)

	// overwrite cookie session
	await overwriteSession(session)

	return session
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
 
	return { isAuth: true }
})