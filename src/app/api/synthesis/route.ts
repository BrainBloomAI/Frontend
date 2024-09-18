import { isAuthenticated } from "@/app/actions";
import textToSpeech from "@google-cloud/text-to-speech"
import { NextRequest, NextResponse } from "next/server";

const client = new textToSpeech.TextToSpeechClient();

const languageCodes = ["en-GB", "cmn-CN", "ms-MY", "hi-IN"]
const voiceNames = ["en-GB-Neural2-B", "cmn-CN-Wavenet-C", "ms-MY-Wavenet-A", "hi-IN-Neural2-B"]

async function synthesis(text: string, langCode: typeof languageCodes[number], voiceName: typeof voiceNames[number]) {
	const request = {
		input: { text },
		voice: { languageCode: langCode, name: voiceName, ssmlGender: "NEUTRAL" as "NEUTRAL" },
		audioConfig: { audioEncoding: "OGG_OPUS" as "OGG_OPUS" },
	};

	const [ response ] = await client.synthesizeSpeech(request);

	if (response == null || typeof response === "string") {
		return
	} else {
		return response
	}
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

	const langChoice = parseInt(searchParams.get("lang") ?? "")
	if (Number.isNaN(langChoice)) {
		return NextResponse.json({ success: false }, { status: 400 })
	}
	if (langChoice >= languageCodes.length) {
		return NextResponse.json({ success: false }, { status: 400 })
	}

	return NextResponse.json({ success: true, result: await synthesis(text, languageCodes[langChoice], voiceNames[langChoice]) })
}