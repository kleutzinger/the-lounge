import { io } from '/socket.io/socket.io.esm.min.js';
import { DEFAULT_CHANNEL, ICE_SERVERS } from './client-config.js';

export const peers = new Map(); // peer_id -> RTCPeerConnection
export const peerMediaElements = new Map(); // peer_id -> <video>
export const local = { stream: null, el: null }; // our own microphone / webcam

export function initSocket() {
  const socket = io();

  socket.on('connect', async () => {
    console.log('Connected to signaling server');
    /* once the user has given us access to their
     * microphone/camera, join the channel and start peering up */
    if (await setupLocalMedia()) socket.emit('join', { channel: DEFAULT_CHANNEL });
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from signaling server');
    /* Tear down all of our peer connections and remove all the
     * media elements when we disconnect */
    for (const id of [...peers.keys()]) removePeer(id);
  });

  /**
   * When we join a group, our signaling server will send out 'addPeer' events to each pair
   * of users in the group (creating a fully-connected graph of users, ie if there are 6 people
   * in the channel you will connect directly to the other 5, so there will be a total of 15
   * connections in the network).
   */
  socket.on('addPeer', async ({ peer_id, should_create_offer }) => {
    console.log('Signaling server said to add peer:', peer_id);
    if (peers.has(peer_id)) {
      console.log('Already connected to peer', peer_id);
      return;
    }
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peers.set(peer_id, pc);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit('relayICECandidate', { peer_id, ice_candidate: candidate.toJSON() });
    };

    pc.ontrack = ({ streams: [stream] }) => {
      let el = peerMediaElements.get(peer_id);
      if (!el) {
        el = Object.assign(document.createElement('video'), {
          id: peer_id,
          autoplay: true,
          playsInline: true,
          controls: true,
          volume: 0, // set by distance once we know where they are
        });
        peerMediaElements.set(peer_id, el);
        document.body.append(el);
      }
      el.srcObject = stream;
    };

    for (const track of local.stream.getTracks()) pc.addTrack(track, local.stream);

    /* Only one side of the peer connection should create the
     * offer, the signaling server picks one to be the offerer.
     * The other user will get a 'sessionDescription' event and will
     * create an answer, then send back an answer 'sessionDescription' to us
     */
    if (should_create_offer) {
      try {
        await pc.setLocalDescription();
        socket.emit('relaySessionDescription', { peer_id, session_description: pc.localDescription });
      } catch (e) {
        console.error('Creating offer failed', e);
      }
    }
  });

  /**
   * Peers exchange session descriptions which contain information
   * about their audio / video settings and that sort of stuff. First
   * the 'offerer' sends a description to the 'answerer' (with type
   * "offer"), then the answerer sends one back (with type "answer").
   */
  socket.on('sessionDescription', async ({ peer_id, session_description }) => {
    const pc = peers.get(peer_id);
    if (!pc) return;
    try {
      await pc.setRemoteDescription(session_description);
      if (session_description.type === 'offer') {
        await pc.setLocalDescription();
        socket.emit('relaySessionDescription', { peer_id, session_description: pc.localDescription });
      }
    } catch (e) {
      console.error('Session description exchange failed', e);
    }
  });

  /**
   * The offerer will send a number of ICE Candidate blobs to the answerer so they
   * can begin trying to find the best path to one another on the net.
   */
  socket.on('iceCandidate', ({ peer_id, ice_candidate }) => {
    peers.get(peer_id)?.addIceCandidate(ice_candidate).catch(console.error);
  });

  /**
   * When a user leaves a channel (or is disconnected from the
   * signaling server) everyone will receive a 'removePeer' message
   * telling them to trash the media channels they have open for
   * that peer. If this client was disconnected, the 'disconnect'
   * handler above tears down all the peer sessions instead.
   */
  socket.on('removePeer', ({ peer_id }) => {
    console.log('Signaling server said to remove peer:', peer_id);
    removePeer(peer_id);
  });

  return socket;
}

function removePeer(peer_id) {
  peerMediaElements.get(peer_id)?.remove();
  peers.get(peer_id)?.close();
  peerMediaElements.delete(peer_id);
  peers.delete(peer_id);
}

/***********************/
/** Local media stuff **/
/***********************/
async function setupLocalMedia() {
  if (local.stream) return true; /* ie, if we've already been initialized */

  console.log('Requesting access to local audio / video inputs');
  let tag = 'video';
  try {
    local.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { width: { ideal: 1 } } });
  } catch (e) {
    console.log("couldn't add video, trying audio only", e);
    tag = 'audio';
    try {
      local.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      console.log('Access denied for audio/video', e);
      alert('Unable to access the camera/microphone, the lounge will not work.');
      return false;
    }
  }

  local.el = Object.assign(document.createElement(tag), {
    id: 'myVideo',
    className: 'positionable',
    autoplay: true,
    muted: true /* always mute ourselves */,
    playsInline: true,
    controls: true,
    srcObject: local.stream,
  });
  document.body.append(local.el);
  return true;
}

/** Replace our outgoing camera (and mic, if the screen has audio) with a screen capture */
export async function startScreenShare() {
  let screen;
  try {
    screen = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
  } catch (e) {
    console.error('Screen share cancelled or failed', e);
    return;
  }
  const [screenVideo] = screen.getVideoTracks();
  const [screenAudio] = screen.getAudioTracks();
  const replacements = { video: screenVideo, audio: screenAudio };

  for (const pc of peers.values()) {
    for (const sender of pc.getSenders()) {
      const replacement = replacements[sender.track?.kind];
      if (replacement) sender.replaceTrack(replacement).catch(console.error);
    }
  }

  for (const track of local.stream.getTracks()) {
    if (replacements[track.kind]) track.stop();
  }
  const keptTracks = local.stream.getTracks().filter((t) => !replacements[t.kind]);
  local.stream = new MediaStream([...screen.getTracks(), ...keptTracks]);
  if (local.el) local.el.srcObject = local.stream;
}
