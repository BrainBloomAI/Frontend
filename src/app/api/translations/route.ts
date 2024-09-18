// Imports the Google Cloud client library
import { isAuthenticated } from "@/app/actions";
import { v2 } from "@google-cloud/translate"
import { NextRequest, NextResponse } from "next/server";

const translate = new v2.Translate();
const langList = ["en", "zh-CN", "ms", "hi"]

async function translateText(text: string, from: typeof langList[number], to: typeof langList[number]) {
	let [ translations ] = await translate.translate(text, to);
	let translationsList = Array.isArray(translations) ? translations : [translations];

	console.log('Translations:');
	translationsList.forEach((translation, i) => {
		console.log(`${text[i]} => (${to}) ${translation}`);
	});

	return translationsList[0]
}

export async function GET(req: NextRequest) {
	if (!isAuthenticated()) {
		return NextResponse.json({ success: false }, { status: 400 })
	}

	const { searchParams } = new URL(req.nextUrl)

	const text = (searchParams.get("text") ?? "").trim()
	if (text.length === 0 || text.length >= 2000) {
		// exceeds limit characters
		return NextResponse.json({ success: false }, { status: 400 })
	}

	const from = parseInt(searchParams.get("from") ?? "")
	const to = parseInt(searchParams.get("to") ?? "")
	if (Number.isNaN(from) || Number.isNaN(to)) {
		return NextResponse.json({ success: false }, { status: 400 })
	}
	if (from >= langList.length || to >= langList.length ) {
		return NextResponse.json({ success: false }, { status: 400 })
	}

	return NextResponse.json({ success: true, result: await translateText(text, langList[from], langList[to]) })
}