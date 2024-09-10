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
	System, // scenario computer reponse
	User // PWIDs
}

export enum RESPONSE_STATUS {
	Okay,
	Improvement,
	NotOkay
}

export type AttemptEntry = {
	id: string,

	attemptNumber: number,
	content: string,
	successful: boolean

	timeTaken: number,
	dialogueId: string
}

export type DialogueEntry = {
	id: string,
	speaker: SPEAKER_ID,
	successful: boolean,

	createdTimestamp: string, // iso format
	gameID: string,

	attempts: Array<AttemptEntry>
}

export type GameData = {
	gameID: string,
	startedTimestamp: string, // ISO format
	status: "ongoing" | "completed" | "failed", // Enum for status
	userID: string,
	scenarioID: string,
	dialogues: Array<DialogueEntry>,
	scenarioData: {
		name: string,
		backgroundImage: string
	}
}

export type GameDescriptionData = {
	title: string,
	backgroundImage: string	
}