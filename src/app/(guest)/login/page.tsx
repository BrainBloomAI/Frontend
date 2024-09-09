"use client"

import { SignupFormSchema } from "@/app/lib/definitions"
import { isAuthenticated, login } from "@/app/actions"
import { useFormState } from "react-dom"
import Alerts from "@/app/lib/ui/alerts"

export default function Signup() {
	const [state, action] = useFormState(login, undefined)

	const inputFormStyling = "rounded bg-gray-100 border border-gray-300 p-2 placeholder:text-slate-500"
	const inputErrorStyling = "text-sm -mt-2 text-red-600"

	return (
		<div className="relative grow flex flex-col">
			<h1 className="font-bold text-2xl pb-2">Signup</h1>
			<form className="grow flex flex-col gap-3" action={action}>
				<input className={inputFormStyling} name="name" type="text" placeholder="Username" autoComplete="email" />
				{state?.errors?.name && <p className={inputErrorStyling}>{state.errors.name}</p>}

				<input className={inputFormStyling} name="password" type="password" placeholder="Password" autoComplete="current-password" />
				{state?.errors?.password && <p className={inputErrorStyling}>{state.errors.password}</p>}

				<button className="rounded p-3 px-5 bg-accent font-bold text-white self-end" type="submit">Login</button>
			</form>
			<a href="/signup" className="font-bold underline">Create an account</a>

			<Alerts message={state?.message}/>
		</div>
	)
}
