export const DEFAULT_CHANNEL = 'some-global-channel-name';

/** You should probably use a different stun server doing commercial stuff **/
export const ICE_SERVERS = [{ urls: 'stun:stun2.l.google.com:19302' }];

export const WORLD = { width: 5000, height: 3000 };
export const MOVE_SPEED = 10;
export const GOD_MODE_SPEED = 20;
// remote audio is full volume within HEARING_FULL px and silent beyond HEARING_MAX px
export const HEARING_FULL = 100;
export const HEARING_MAX = 900;
