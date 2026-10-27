export function createJoystick(parent) {
  const maxDiff = 100;
  const stick = document.createElement('div');
  stick.classList.add('joystick');

  let dragStart = null;
  let currentPos = { x: 0, y: 0 };

  stick.addEventListener('pointerdown', (event) => {
    stick.setPointerCapture(event.pointerId);
    stick.style.transition = '0s';
    dragStart = { x: event.clientX, y: event.clientY };
  });

  stick.addEventListener('pointermove', (event) => {
    if (dragStart === null) return;
    const xDiff = event.clientX - dragStart.x;
    const yDiff = event.clientY - dragStart.y;
    const angle = Math.atan2(yDiff, xDiff);
    const distance = Math.min(maxDiff, Math.hypot(xDiff, yDiff));
    const xNew = Math.cos(angle);
    const yNew = Math.sin(angle);
    stick.style.transform = `translate3d(${distance * xNew}px, ${distance * yNew}px, 0px)`;
    currentPos = { x: xNew, y: yNew };
  });

  const release = () => {
    if (dragStart === null) return;
    stick.style.transition = '.2s';
    stick.style.transform = 'translate3d(0px, 0px, 0px)';
    dragStart = null;
    currentPos = { x: 0, y: 0 };
  };
  stick.addEventListener('pointerup', release);
  stick.addEventListener('pointercancel', release);

  parent.appendChild(stick);
  return {
    getPosition: () => currentPos,
  };
}
