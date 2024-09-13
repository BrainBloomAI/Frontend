"use client"

import { SignupFormSchema } from "@/app/lib/definitions"
import { createNewScenario } from "@/app/actions"
import { useFormState } from "react-dom"
import Alerts from "@/app/lib/ui/alerts"

export default function CreateNewScenario() {
	const [state, action] = useFormState(createNewScenario, undefined)

	const inputFormStyling = "rounded bg-gray-100 border border-gray-300 p-2 placeholder:text-slate-500"
	const inputErrorStyling = "text-sm -mt-2 text-red-600"

	return (
		<div className="p-8">
			<div className="relative grow flex flex-col">
				<div className="flex gap-3">
					<a className="font-bold text-2xl" href="/scenarios">&lt;</a>
					<h1 className="font-bold text-2xl pb-2">Create new scenario</h1>
				</div>
				<form className="grow flex flex-col gap-3" action={action}>
					<input className={inputFormStyling} name="name" type="text" placeholder="Scenario name" />
					{state?.errors?.name && <p className={inputErrorStyling}>{state.errors.name}</p>}

					<input className={inputFormStyling} name="description" type="text" placeholder="Description" />
					{state?.errors?.description && <p className={inputErrorStyling}>{state.errors.description}</p>}

					<input className={inputFormStyling} name="modelRole" type="text" placeholder="Role model play as (e.g. customer)" />
					{state?.errors?.modelRole && <p className={inputErrorStyling}>{state.errors.modelRole}</p>}

					<input className={inputFormStyling} name="userRole" type="text" placeholder="Role user play as (e.g. barista)" />
					{state?.errors?.userRole && <p className={inputErrorStyling}>{state.errors.userRole}</p>}

					<input className={inputFormStyling} name="image" type="file" />

					<button className="rounded p-3 px-5 bg-accent font-bold text-white self-end" type="submit">Create</button>
				</form>
			</div>
			<Alerts message={state?.message}/>
		</div>
	)
}
