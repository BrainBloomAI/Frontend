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

export type ScenarioEntry = {
	scenarioID: string;
	name: string;
	backgroundImage: string;
	description: string;
	created: string;   // ISO date string
	createdAt: string; // ISO date string
	updatedAt: string; // ISO date string
}