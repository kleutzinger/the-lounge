import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 2999;
const BROADCAST_INTERVAL_MS = 50;
// the only avatar properties clients are allowed to change about themselves
const SELF_EDITABLE = ['x', 'y', 'width'];

const staticDir = fileURLToPath(new URL('./static', import.meta.url));
const lilGuiDir = fileURLToPath(new URL('./node_modules/lil-gui/dist', import.meta.url));

const app = express();
app.get('/', (req, res) => res.sendFile('client.html', { root: staticDir }));
app.use('/static', express.static(staticDir));
app.use('/vendor/lil-gui', express.static(lilGuiDir));

const server = createServer(app);
const io = new Server(server);

/*************************/
/*** INTERESTING STUFF ***/
/*************************/
const channels = new Map(); // channel name -> Map(socket id -> socket)
const avatars = new Map(); // socket id -> avatar
let globalText = 'global Messageboard';

/**
 * Users will connect to the signaling server, after which they'll issue a "join"
 * to join a particular channel. The signaling server keeps track of all sockets
 * who are in a channel, and on join will send out 'addPeer' events to each pair
 * of users in a channel. When clients receive the 'addPeer' event they'll begin
 * setting up an RTCPeerConnection with one another. During this process they'll
 * need to relay ICECandidate information to one another, as well as SessionDescription
 * information. After all of that happens, they'll finally be able to complete
 * the peer connection and will be streaming audio/video between each other.
 */
io.on('connection', (socket) => {
  const joined = new Set();
  const log = (...args) => console.log(`[${socket.id}]`, ...args);
  log('connection accepted');

  socket.on('join', ({ channel } = {}) => {
    log('join', channel);
    if (joined.has(channel)) {
      log('ERROR: already joined', channel);
      return;
    }
    if (!channels.has(channel)) channels.set(channel, new Map());
    const members = channels.get(channel);

    socket.emit('updateGlobalText', globalText);
    avatars.set(socket.id, {
      id: socket.id,
      peer_id: socket.id,
      x: 0,
      y: 0,
      width: 320,
      height: '',
      type: 'user',
    });

    for (const [id, member] of members) {
      member.emit('addPeer', { peer_id: socket.id, should_create_offer: false });
      socket.emit('addPeer', { peer_id: id, should_create_offer: true });
    }

    members.set(socket.id, socket);
    joined.add(channel);
  });

  function part(channel) {
    log('part', channel);
    if (!joined.has(channel)) {
      log('ERROR: not in', channel);
      return;
    }
    joined.delete(channel);
    const members = channels.get(channel);
    members.delete(socket.id);
    for (const [id, member] of members) {
      member.emit('removePeer', { peer_id: socket.id });
      socket.emit('removePeer', { peer_id: id });
    }
    if (members.size === 0) channels.delete(channel);
  }
  socket.on('part', part);

  socket.on('disconnect', () => {
    for (const channel of joined) part(channel);
    avatars.delete(socket.id);
    log('disconnected');
  });

  socket.on('relayICECandidate', ({ peer_id, ice_candidate } = {}) => {
    io.to(peer_id).emit('iceCandidate', { peer_id: socket.id, ice_candidate });
  });

  socket.on('relaySessionDescription', ({ peer_id, session_description } = {}) => {
    log('relaying session description to', peer_id, session_description?.type);
    io.to(peer_id).emit('sessionDescription', { peer_id: socket.id, session_description });
  });

  socket.on('updateGlobalText', (text) => {
    globalText = String(text);
    io.emit('updateGlobalText', globalText);
  });

  socket.on('updateSelf', (update) => {
    const avatar = avatars.get(socket.id);
    if (!avatar) return;
    for (const prop of SELF_EDITABLE) {
      if (Number.isFinite(update?.[prop])) avatar[prop] = update[prop];
    }
  });
});

setInterval(() => {
  if (avatars.size > 0) io.emit('updateObjects', [...avatars.values()]);
}, BROADCAST_INTERVAL_MS);

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
