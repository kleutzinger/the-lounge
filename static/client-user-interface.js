import GUI from '/vendor/lil-gui/lil-gui.esm.min.js';
import { createJoystick } from './virtualjoystick.js';
import { setTwitch } from './global-games.js';
import { startScreenShare } from './socketSetup.js';

export const joystick = createJoystick(document.getElementById('joystickZone'));

export const guiOptions = {
  receiveStreams: true,
  godMode: true,
  width: 320,
  streamerId: 'btssmash',
};

export function setupGui() {
  const gui = new GUI();
  gui.close();
  gui.add(guiOptions, 'receiveStreams');
  gui.add(guiOptions, 'godMode');
  gui.add(guiOptions, 'width', 40, 1280, 10);
  gui.add(guiOptions, 'streamerId');
  gui.add({ setTwitch: () => setTwitch(guiOptions.streamerId) }, 'setTwitch');
  gui.add(
    {
      toggleJoystick() {
        const zone = document.getElementById('joystickZone');
        zone.hidden = !zone.hidden;
      },
    },
    'toggleJoystick',
  );
  gui.add({ screenShare: startScreenShare }, 'screenShare');
}

export function isScrolledIntoView(el) {
  const { top, bottom, left, right } = el.getBoundingClientRect();
  return top >= 0 && left >= 0 && bottom <= window.innerHeight && right <= window.innerWidth;
}

const ARROWS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
export const held = { left: false, right: false, up: false, down: false };

function trackArrow(e, isDown) {
  const dir = ARROWS[e.key];
  if (!dir || e.target.closest('input, textarea')) return;
  held[dir] = isDown;
}
document.addEventListener('keydown', (e) => trackArrow(e, true));
document.addEventListener('keyup', (e) => trackArrow(e, false));
window.addEventListener('blur', () => Object.keys(held).forEach((dir) => (held[dir] = false)));
