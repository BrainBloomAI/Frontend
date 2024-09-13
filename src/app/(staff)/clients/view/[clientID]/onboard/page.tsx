"use client";
import { useFormState } from "react-dom"
import { useState } from "react";
import { getClientData, updateMindsEvaluation } from "@/app/actions";
import Alerts from "@/app/lib/ui/alerts";

export default function OnboardPage({ params }: { params: { clientID: string }}) {
  const [state, action] = useFormState(updateMindsEvaluation, undefined)

  // state for sliders and additional fields
  const [listeningValue, setListeningValue] = useState<string>("0");
  const [eqValue, setEqValue] = useState<string>("0");
  const [toneValue, setToneValue] = useState<string>("0");
  const [helpfulnessValue, setHelpfulness] = useState<string>("0");
  const [clarityValue, setClarity] = useState<string>("0");
  const [assessment, setAssessment] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null); // Message for alerts

  // function to dynamically generate the slider background with filled blue
  const getSliderBackground = (value: number) => {
    return `linear-gradient(to right, #3b82f6 ${value}%, #e5e7eb ${value}%)`;
  };

  return (
    <div className="p-8">
      <form action={action}>
        <input name="clientIDLookup" type="text" value={params.clientID} className="hidden" />

        <div className="flex flex-col items-center py-4">
          <label htmlFor="listeningSlider" className="text-lg mb-2 font-semibold">
            Listening: {listeningValue}
          </label>
          <div className="relative w-full max-w-sm">
            <input
              type="range"
              id="listeningSlider"
              min="0"
              max="100"
              name="listening"
              step="0.1"
              value={parseFloat(listeningValue) || 0}
              onChange={(e) => setListeningValue(e.target.value)}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: getSliderBackground(parseFloat(listeningValue) || 0),
              }}
            />
          </div>
          <input
            type="number"
            value={listeningValue}
            min="0"
            max="100"
            step="0.1"
            onChange={(e) => setListeningValue(e.target.value)}
            className="mt-2 border border-gray-300 rounded-md p-1 w-24 text-center"
          />
        </div>

        <div className="flex flex-col items-center py-4">
          <label htmlFor="eqSlider" className="text-lg mb-2 font-semibold">
            EQ: {eqValue}
          </label>
          <div className="relative w-full max-w-sm">
            <input
              type="range"
              id="eqSlider"
              min="0"
              max="100"
              name="eq"
              step="0.1"
              value={parseFloat(eqValue) || 0}
              onChange={(e) => setEqValue(e.target.value)}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: getSliderBackground(parseFloat(eqValue) || 0),
              }}
            />
          </div>
          <input
            type="number"
            value={eqValue}
            min="0"
            max="100"
            step="0.1"
            onChange={(e) => setEqValue(e.target.value)}
            className="mt-2 border border-gray-300 rounded-md p-1 w-24 text-center"
          />
        </div>

        <div className="flex flex-col items-center py-4">
          <label htmlFor="toneSlider" className="text-lg mb-2 font-semibold">
            Tone: {toneValue}
          </label>
          <div className="relative w-full max-w-sm">
            <input
              type="range"
              id="toneSlider"
              min="0"
              max="100"
              name="tone"
              step="0.1"
              value={parseFloat(toneValue) || 0}
              onChange={(e) => setToneValue(e.target.value)}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: getSliderBackground(parseFloat(toneValue) || 0),
              }}
            />
          </div>
          <input
            type="number"
            value={toneValue}
            min="0"
            max="100"
            step="0.1"
            onChange={(e) => setToneValue(e.target.value)}
            className="mt-2 border border-gray-300 rounded-md p-1 w-24 text-center"
          />
        </div>

        <div className="flex flex-col items-center py-4">
          <label htmlFor="helpSlider" className="text-lg mb-2 font-semibold">
            Helpfulness: {helpfulnessValue}
          </label>
          <div className="relative w-full max-w-sm">
            <input
              type="range"
              id="helpSlider"
              min="0"
              max="100"
              name="helpfulness"
              step="0.1"
              value={parseFloat(helpfulnessValue) || 0}
              onChange={(e) => setHelpfulness(e.target.value)}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: getSliderBackground(parseFloat(helpfulnessValue) || 0),
              }}
            />
          </div>
          <input
            type="number"
            value={helpfulnessValue}
            min="0"
            max="100"
            step="0.1"
            onChange={(e) => setHelpfulness(e.target.value)}
            className="mt-2 border border-gray-300 rounded-md p-1 w-24 text-center"
          />
        </div>

        <div className="flex flex-col items-center py-4">
          <label htmlFor="claritySlider" className="text-lg mb-2 font-semibold">
            Clarity: {clarityValue}
          </label>
          <div className="relative w-full max-w-sm">
            <input
              type="range"
              id="claritySlider"
              min="0"
              max="100"
              name="clarity"
              step="0.1"
              value={parseFloat(clarityValue) || 0}
              onChange={(e) => setClarity(e.target.value)}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: getSliderBackground(parseFloat(clarityValue) || 0),
              }}
            />
          </div>
          <input
            type="number"
            value={clarityValue}
            min="0"
            max="100"
            step="0.1"
            onChange={(e) => setClarity(e.target.value)}
            className="mt-2 border border-gray-300 rounded-md p-1 w-24 text-center"
          />
        </div>

        <textarea
          className="border border-gray-300 rounded-md p-2 w-full mt-4"
          value={assessment}
          name="assessment"
          onChange={(e) => setAssessment(e.target.value)}
          placeholder="Enter your assessment"
        />

        <button
          className="bg-green-500 text-white px-4 py-2 rounded-md self-end"
          type="submit"
        >
          Submit
        </button>
      </form>
      {state?.errors && <p>{state.errors.listening}</p>}
    </div>)
}