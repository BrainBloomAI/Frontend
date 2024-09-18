# Startup
To startup a development server,
```
npm i
npm run dev
```

Alternatively, you may use `pnpm` as a drop-in replacement for `npm`

To build:
```
npm run build
```

## /src/app/config.ts
Configuration for frontend
- `.serverOrigin`: (string) URL address of BrainBroomAI's backend (e.g. "http://localhost:8000", no leading forward slash)
- `.authTokenHeaderKeyName`: (string) name of authorisation header accepted by BrainBroomAI's backend to pass in authentication token
- `speechServiceURL`: (string) server origin of [Speech Service](https://github.com/BrainBloomAI/SpeechService) server (e.g. "localhost:3001")
- `speechServiceRecongitionProtocol`: (string) protocol for speech service's recognition (e.g. "ws")
- `speechServiceRecognitionNamespace`: (string) name space for speech service's recognition (e.g. "recognition")
- `speechServiceSynthesisProtocol`: (string) protocol for speech service's synthesis (e.g. "http")
- `speechServiceSynthesisNamespace`: (string) name space for speech service's synthesis (e.g. "synthesis")
- `.GameTheme`
	- `.background`: (string) hexadecimal color code for the background of the game page
	- `.responseIndicator`: (string[]) hexadecimal color codes for the response indicators mapped to `[OKAY, NOT OKAY]`, modifies the color of the response text as indicators

## .env.local
Only one variable is used to maintain sessions
- `SECRET_KEY`: (string) 32 byte base64 encoded key

# Dependencies
- [`next.js`](https://nextjs.org/): web framework with React
- [`jose`](https://www.npmjs.com/package/jose): JWT tokens support
- [`react-hook-form`](https://react-hook-form.com/): 3rd party reactive form elements
- [`hookform/resolvers`](https://react-hook-form.com/get-started#SchemaValidation): react-hook-form's built-in resolver for zod schemas
- [`zod`](https://zod.dev/): 3rd party schema declaration and validation
- [`axios`](https://axios-http.com/): HTTP client to send API calls to BrainBloomAI's own backend
- [`socket.io-client`](https://socket.io/): web socket application on the client side, to interact with Speech Service

# Resources
- Icons sourced from [Phosphor Icons](https://phosphoricons.com/)
- Bing sound effect from [orangefreesounds](https://orangefreesounds.com/mario-coin-sound/)