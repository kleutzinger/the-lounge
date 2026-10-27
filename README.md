### Come hang out in the lounge
Live at:
https://lounge.kevbot.xyz

navigate your avatar around the video chat with the arrow keys (or the on-screen joystick on mobile).
The closer you are to someone, the louder they get.
![](https://i.imgur.com/50ra8kv.png)

### Running locally

Requires Node 22+.

```sh
npm install
npm run dev   # restarts on file changes; serves on http://localhost:2999 (override with PORT)
```

Camera/mic access requires `localhost` or HTTPS.

### How it works

`signaling-server.js` is an Express + Socket.IO server that relays WebRTC offers/answers/ICE candidates
between browsers (full mesh: everyone connects directly to everyone) and broadcasts everyone's avatar position.
The client in `static/` is plain ES modules, no build step.

Deployed by pushing to the `dokku` remote.
