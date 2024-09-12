import { z } from "zod"

export const LoginFormSchema = z.object({
	name: z
		.string()
		.min(2, { message: "Name must be at least 2 characters long." })
		.trim(),
	password: z
		.string()
		.min(8, { message: "Be at least 8 characters long." })
		.regex(/[a-zA-Z]/, { message: "Contain at least one letter." })
		.regex(/[0-9]/, { message: "Contain at least one number." })
		.regex(/[^a-zA-Z0-9]/, {
			message: "Contain at least one special character.",
		})
		.trim(),
});

export const SignupFormSchema = z.object({
	name: z
		.string()
		.min(2, { message: "Name must be at least 2 characters long." })
		.trim(),
	email: z.string().email({ message: "Please enter a valid email." }).trim(),
	password: z
		.string()
		.min(8, { message: "Be at least 8 characters long." })
		.regex(/[a-zA-Z]/, { message: "Contain at least one letter." })
		.regex(/[0-9]/, { message: "Contain at least one number." })
		.regex(/[^a-zA-Z0-9]/, {
			message: "Contain at least one special character.",
		})
		.trim(),
	confirmPassword: z
		.string()
}).superRefine(({ confirmPassword, password }, ctx) => {
	if (confirmPassword !== password) {
		ctx.addIssue({
			code: "custom",
			message: "The passwords did not match.",
			path: ["confirmPassword"]
		});
	}
});
 
export type FormState =
	| {
			errors?: {
				name?: string[]
				email?: string[]
				password?: string[]
			}
			message?: string
		}
	| undefined

/**
 * FOR GAMES
 */
export type ScenarioEntry = {
	scenarioID: string;
	name: string;
	backgroundImage: string;
	description: string;
	created: string;   // ISO date string
	createdAt: string; // ISO date string
	updatedAt: string; // ISO date string
}

export enum SPEAKER_ID {
	System = "system", // scenario computer reponse
	User = "user" // PWIDs
}

export enum RESPONSE_STATUS {
	Okay,
	Improvement,
	NotOkay
}

export type AttemptEntry = {
	attemptID: string,

	dialogueId: string,
	attemptNumber: number,

	content: string,
	successful: boolean,

	timeTaken: number,
	timestamp: string // ISO format
}

export type DialogueEntry = {
	dialogueID: string,
	by: SPEAKER_ID,

	attemptsCount: number,
	successful: boolean,

	createdTimestamp: string, // iso format
	gameID: string,

	attempts: Array<AttemptEntry>
}

export type ScenarioData = {
	scenarioID: string,
	name: string, // retail
	backgroundImage: string, // baseURL/public/img/${backgroundImage}
	description: string,
	modelRole: string, // customer
	userRole: string, // retail worker
	created: string // ISO format
}

export type EvaluationData = {
	evaluationID: string,
	listening: number,
	eq: number,
	tone: number,
	helpfulness: number,
	clarity: number,
	simpleDescription: string,
	fullDescription: string,
	associatedGameID: string
}

export type GameData = {
	gameID: string,
	startedTimestamp: string, // ISO format
	pointsEarned?: number, // TODO: variable presence?
	status: "ongoing" | "complete" | "abandoned", // Enum for status
	userID: string,
	scenarioID: string,
	dialogues?: Array<DialogueEntry>,
	scenario?: ScenarioData,
	evaluation: EvaluationData|null
}

export type GameDescriptionData = {
	title: string, // retail
	subtitle: string, // retail workrer
	backgroundImage: string	
}

export type ProfileData = {
	userID: string,
	username: string,
	email: string,
	role: string,
	points: 135,
	created: string,
	lastLogin: string,
	activeGame?: string,
	mindsListening?: number,
	mindsEQ?: number,
	mindsTone?: number,
	mindsHelpfulness?: number,
	mindsClarity?: number,
	mindsAssessment?: number,
	banned: boolean
}

export type ExtProfileData = ProfileData & { games: Array<GameData> }