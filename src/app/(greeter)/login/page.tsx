"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const loginSchema = z.object({
	username: z.string(),
	password: z.string()
})

type Schema = z.infer<typeof loginSchema>

export default function Login() {
	const { register, handleSubmit } = useForm<Schema>({
		resolver: zodResolver(loginSchema)
	})

	const onSubmit = (data: Schema) => {
		// validated data
		console.log("submitted", data)
	}

	const inputFormStyling = "rounded bg-gray-100 border border-gray-300 p-2 placeholder:text-slate-500"

	return (
		<div className="grow flex flex-col">
			<h1 className="font-bold text-2xl pb-2">Login</h1>
			<form className="grow flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
				<input className={inputFormStyling} {...register("username")} type="text" placeholder="Username" autoComplete="email" />
				<input className={inputFormStyling} {...register("password")} type="password" placeholder="Password" autoComplete="new-password" />
				<button className="rounded p-3 px-5 bg-accent font-bold text-white self-end">Login</button>
			</form>
			<a href="/signup" className="font-bold underline">Create an account</a>
		</div>
	)
}
