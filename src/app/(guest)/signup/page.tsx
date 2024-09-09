"use client"

import { SignupFormSchema } from "@/app/lib/definitions"
import { isAuthenticated, signup } from "@/app/actions"
import { useFormState } from "react-dom"
import Alerts from "@/app/lib/ui/alerts"

export default function Signup() {
	const [state, action] = useFormState(signup, undefined)

	const inputFormStyling = "rounded bg-gray-100 border border-gray-300 p-2 placeholder:text-slate-500"
	const inputErrorStyling = "text-sm -mt-2 text-red-600"

	return (
		<>
			<div className="relative grow flex flex-col">
				<h1 className="font-bold text-2xl pb-2">Signup</h1>
				<form className="grow flex flex-col gap-3" action={action}>
					<input className={inputFormStyling} name="email" type="email" placeholder="Email" />
					{state?.errors?.email && <p className={inputErrorStyling}>{state.errors.email}</p>}

					<input className={inputFormStyling} name="name" type="text" placeholder="Username" autoComplete="email" />
					{state?.errors?.name && <p className={inputErrorStyling}>{state.errors.name}</p>}

					<input className={inputFormStyling} name="password" type="password" placeholder="Password" autoComplete="new-password" />
					{state?.errors?.password && (
						<div className={inputErrorStyling}>
							<p>Password must:</p>
							<ul>
								{state.errors.password.map((error) => (
									<li key={error}>- {error}</li>
								))}
							</ul>
						</div>
					)}

					<input className={inputFormStyling} name="confirmPassword" type="password" placeholder="Confirm password" autoComplete="new-password" />
					{state?.errors?.confirmPassword && <p className={inputErrorStyling}>{state.errors.confirmPassword}</p>}

					<button className="rounded p-3 px-5 bg-accent font-bold text-white self-end" type="submit">Login</button>
				</form>
				<a href="/login" className="font-bold underline">Log in</a>
			</div>
			<Alerts message={state?.message}/>
		</>
	)
}
