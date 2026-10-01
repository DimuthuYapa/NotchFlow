# NotchFlow

NotchFlow is a Windows-first, ambient focus companion. It uses a gold grace ring and red distraction state instead of blocking browsing or producing a report after the fact.

## What is included

- **Tauri + React + TypeScript** desktop application scaffold, packaged for Windows MSI.
- An animated visual focus indicator, a ten-second distraction grace period, return-to-focus action, gentle copy, and an optional local camera permission flow.
- Hybrid URL review: local approved-domain rules and distraction heuristics first, then an optional cloud endpoint for uncertain URLs, with manual approval as the safe fallback.
- A Chrome Manifest V3 companion that reports active HTTP(S) tabs to the native desktop host.

## Run the interface

```bash
npm install
npm run dev
```

For the desktop shell, install the [Tauri prerequisites for Windows](https://v2.tauri.app/start/prerequisites/) and run `npm run tauri dev` after adding the Tauri CLI to your development dependencies.

## Configure cloud URL review

The optional endpoint receives `POST` JSON of the form `{ "url": "https://example.com" }` and must reply with:

```json
{ "decision": "approved", "reason": "Documentation site" }
```

Valid decisions are `approved`, `distracting`, and `review`. Do not put a provider API key in the Chrome extension or frontend; route provider requests through a trusted backend endpoint.

## Chrome companion and native host

Load `chrome-extension` using **chrome://extensions → Developer mode → Load unpacked**. The included extension expects a native messaging host called `com.notchflow.chrome`. Implementing and registering that Windows host is the final bridge needed to route tab messages into the Tauri process. Keep it local and pass only the active URL/title.

## Privacy

Camera access is opt-in. The supplied application requests a user-facing camera briefly to confirm consent and immediately stops its stream; production head-pose inference should run locally on a live stream and should never persist or upload frames.
