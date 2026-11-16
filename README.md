# Facecall

A small browser-based group calling starter built with Express, Socket.IO and browser WebRTC. The current implementation supports rooms (up to 8 peers in a mesh), camera/microphone controls, screen sharing, participant status, hand raising, room invite links, and ephemeral in-call chat.

## Run locally

- Node.js 18 or newer
- `npm install`
- `npm start`
- Open http://localhost:3000 in two or more browser windows and join the same room.

Camera/microphone APIs work on `localhost` and HTTPS deployments. Screen sharing requires a user gesture and browser support.

## Deploy

The included Dockerfile can be built with `docker build -t facecall .` and run with `docker run --rm -p 3000:3000 facecall`. Terminate HTTPS at your hosting platform or reverse proxy. WebRTC generally needs a TURN relay for reliable connectivity across restrictive networks; configure a managed TURN service before production. The public STUN server is only a best-effort development default.

## Important limitations

This is a demo/starter, not a fully production-ready conferencing service. Mesh calling sends a separate stream to each peer and is intended for small rooms; larger calls need an SFU. Rooms and chat are in-memory and disappear on restart. There is no authentication, moderation, persistence, end-to-end application-level encryption, recording, or abuse prevention. Use HTTPS, restricted origins, rate limits, a TURN service, and a scalable SFU before handling real users or sensitive calls.
