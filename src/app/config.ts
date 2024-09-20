const dev = {
	serverOrigin: "http://localhost:8000",
	authTokenHeaderKeyName: "authtoken",

	speechServiceURL: "localhost:3001",
	speechServiceRecongitionProtocol: "ws",
	speechServiceRecognitionNamespace: "recognition",
	speechServiceSynthesisProtocol: "http",
	speechServiceSynthesisNamespace: "synthesis",

	GameTheme: {
		background: "#1a1a1a",
		responseIndicator: ["#fff", "#ff4b1f"],
	}
}

const prod = {
	serverOrigin: "https://backend-nyp.apps.hackathon.cnasg.dellcsc.com",
	authTokenHeaderKeyName: "authtoken",

	speechServiceURL: "speechrecog-nyp.apps.hackathon.cnasg.dellcsc.com",
	speechServiceRecongitionProtocol: "wss",
	speechServiceRecognitionNamespace: "recognition",
	speechServiceSynthesisProtocol: "https",
	speechServiceSynthesisNamespace: "synthesis",

	GameTheme: {
		background: "#1a1a1a",
		responseIndicator: ["#fff", "#ff4b1f"],
	}
}

function getConfig() {
	console.log("GETTING CONFIG", process.env.NODE_ENV, process.env.NODE_ENV === "production")

	return process.env.NODE_ENV === "production" ? prod : dev
}

export default getConfig()