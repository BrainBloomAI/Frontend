import "server-only"
import { authenticateSession } from "@/app/lib/dataAccessLayer"

export const signup = (username: string, email: string, password: string) => {
	// API

	// get auth token
}

export const login = async (username: string, password: string) => {
	const loginSuccess = await authenticateSession({ username, password })

	if (loginSuccess === false) {
		// failed to log in
		return false
	}

	return true
}