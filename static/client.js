import { WORLD, MOVE_SPEED, GOD_MODE_SPEED, HEARING_FULL, HEARING_MAX } from './client-config.js';
import { addCharades, toggleSkribbl, spawnYoutubeIframe } from './global-games.js';
import { guiOptions, held, joystick, isScrolledIntoView, setupGui } from './client-user-interface.js';
import { initSocket, local, peerMediaElements } from './socketSetup.js';

const me = { x: Math.random() * 100, y: Math.random() * 100 };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

setupGui();
document.getElementById('skribblLoad').addEventListener('click', toggleSkribbl);
document.getElementById('destroy').addEventListener(
  'click',
  (e) => {
    e.currentTarget.remove();
    init();
  },
  { once: true },
);

function init() {
  const socket = initSocket();
  // spawnTwitch('thewaffle77', 167, 1640); //spawns into the billiards room
  // spawnYoutubeIframe('G0IBqtO1K28', 1325, 600); //puppies in the hall
  spawnYoutubeIframe('jfKfPfyJRdk', 2300, 10); //chill lofi beats in the lounge
  addCharades();

  const globalText = document.getElementById('globalText');
  globalText.addEventListener('change', () => socket.emit('updateGlobalText', globalText.value));
  socket.on('updateGlobalText', (text) => (globalText.value = text));

  setInterval(() => {
    socket.emit('updateSelf', { x: me.x, y: me.y, width: guiOptions.width });
  }, 200);

  let lastFrame = performance.now();
  function moveSelf(now) {
    // speeds are tuned in px per 20ms
    const step = ((guiOptions.godMode ? GOD_MODE_SPEED : MOVE_SPEED) * (now - lastFrame)) / 20;
    lastFrame = now;
    const stick = joystick.getPosition();
    me.x += (held.right - held.left + stick.x) * step;
    me.y += (held.down - held.up + stick.y) * step;
    if (!guiOptions.godMode) {
      me.x = clamp(me.x, 0, WORLD.width - 320 - 200);
      me.y = clamp(me.y, 0, WORLD.height - 240 - 200);
    }
    if (local.el) {
      local.el.style.left = `${me.x}px`;
      local.el.style.top = `${me.y}px`;
      local.el.style.width = `${guiOptions.width}px`;
      if (!isScrolledIntoView(local.el)) local.el.scrollIntoView();
    }
    requestAnimationFrame(moveSelf);
  }
  requestAnimationFrame(moveSelf);

  // The server broadcasts every avatar in the room a few times per second
  socket.on('updateObjects', (avatars) => {
    for (const avatar of avatars) {
      if (avatar.peer_id === socket.id) continue;
      // we normally hear about an avatar before webrtc has finished connecting
      const el = peerMediaElements.get(avatar.peer_id);
      if (!el) continue;

      el.classList.add('positionable');
      el.style.left = `${avatar.x}px`;
      el.style.top = `${avatar.y}px`;
      el.style.width = `${avatar.width}px`;

      const distance = Math.hypot(avatar.x - me.x, avatar.y - me.y);
      el.volume = clamp((HEARING_MAX - distance) / (HEARING_MAX - HEARING_FULL), 0, 1);
      const enabled = el.volume > 0 && guiOptions.receiveStreams;
      el.srcObject?.getTracks().forEach((t) => (t.enabled = enabled));
    }
  });
}
