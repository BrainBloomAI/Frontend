"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const signupSchema = z.object({
	email: z.string(),
	username: z.string(),
	password: z.string(),
	cfmPassword: z.string()
})

type Schema = z.infer<typeof signupSchema>

export default function Login() {
	const { register, handleSubmit } = useForm<Schema>({
		resolver: zodResolver(signupSchema)
	})

	const onSubmit = (data: Schema) => {
		// validated data
		console.log("submitted", data)
	}

	const inputFormStyling = "rounded bg-gray-100 border border-gray-300 p-2 placeholder:text-slate-500"

	return (
		<div className="grow flex flex-col">
			<h1 className="font-bold text-2xl pb-2">Signup</h1>
			<form className="grow flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
				<input className={inputFormStyling} {...register("email")} type="email" placeholder="Email" />
				<input className={inputFormStyling} {...register("username")} type="text" placeholder="Username" autoComplete="email" />
				<input className={inputFormStyling} {...register("password")} type="password" placeholder="Password" autoComplete="new-password" />
				<input className={inputFormStyling} {...register("cfmPassword")} type="password" placeholder="Confirm password" autoComplete="new-password" />
				<button className="rounded p-3 px-5 bg-accent font-bold text-white self-end">Login</button>
			</form>
			<a href="/login" className="font-bold underline">Log in</a>
		</div>
	)
}
