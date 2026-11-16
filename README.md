# Facecall

A lightweight browser-based video call app using Socket.IO and WebRTC.

## Features
- Join a room by name
- Real-time video and audio streaming
- Participant list
- In-call chat
- Copyable room links
- Mic/camera toggles
- Leave/end-call flow

## Requirements
- Node.js 18+
- A browser with camera and microphone permission support

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open the app in a browser:
   ```text
   http://localhost:3000
   ```

4. Open a second tab or browser and join the same room name to test calls.

## Production notes
- Use a real TURN/STUN setup for production WebRTC connectivity.
- Add HTTPS in production.
- Set `PORT` via environment variable if needed.
- Consider reverse proxying behind Nginx or a managed platform.

## Environment variables
- `PORT` — server port (default: 3000)
