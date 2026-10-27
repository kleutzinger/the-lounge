// prettier-ignore
const charadesWordlist = ['ping pong', 'snowball', 'roof', 'fly', 'fang', 'bicycle', 'bear', 'cape', 'puppet', 'piano', 'lipstick', 'salute', 'hula hoop', 'penguin', 'banana peel', 'whisper', 'popsicle', 'Frankenstein', 'earthquake', 'yo-yo', 'road', 'rain', 'alarm clock', 'dog leash', 'chop', 'pajamas', 'slam dunk', 'fiddle', 'seashell', 'jog', 'seesaw', 'nap', 'cheerleader', 'blind', 'beg', 'shopping cart', 'Michael Jackson', 'limbo', 'newspaper', 'twist', 'rhinoceros', 'cow', 'tickle', 'fetch', 'violin', 'cage', 'cello', 'braid', 'skateboard', 'stairs', 'trumpet', 'mop', 'shovel', 'money', 'soap', 'saddle', 'wink', 'tree', 'Spider Man', 'think', 'Airplane', 'Ears', 'Piano', 'Angry', 'Elephant', 'Pinch', 'Baby', 'Fish', 'Reach', 'Ball', 'Flick', 'Remote', 'Baseball', 'Football', 'Roll', 'Basketball', 'Fork', 'Sad', 'Bounce', 'Giggle', 'Scissors', 'Cat', 'Golf', 'Skip', 'Chicken', 'Guitar', 'Sneeze', 'Chimpanzee', 'Hammer', 'Spin', 'Clap', 'Happy', 'Spoon', 'Cough', 'Horns', 'Stomp', 'Cry', 'Joke', 'Stop', 'Dog', 'Mime', 'Tail', 'Drink', 'Penguin', 'Toothbrush', 'Drums', 'Phone', 'Wiggle', 'Duck', 'Photographer', 'Archer', 'Ghost', 'Rock star', 'Balance beam', 'Haircut', 'Shoelaces', 'Ballet', 'Halo', 'Sick', 'Balloon', 'Hiccup', 'Singer', 'Banana peel', 'Hot dog', 'Skateboard', 'Book', 'Hungry', 'Slippery', 'Braces', 'Hurt', 'Soccer', 'Button', 'Ice skating', 'Strong', 'Car', 'Karate', 'Stubbed toe', 'Cheers', 'Ladder', 'Sunshine', 'Clown', 'Light bulb', 'Surprise', 'Dinosaur', 'Limbo', 'Swing', 'Disco', 'Macarena', 'Sword', 'Dizzy', 'Paint', 'Tap dance', 'Fart', 'Pirate', 'Wheelbarrow', 'Fishing', 'Read', 'Wizard of Oz', 'Gallop', 'River dance'];

const SKRIBBL_URL = 'https://skribbl.io/';

export function addCharades() {
  const button = Object.assign(document.createElement('button'), {
    id: 'charadesButton',
    textContent: 'Charades!',
  });
  button.addEventListener('click', () => {
    const randomWord = charadesWordlist[Math.floor(Math.random() * charadesWordlist.length)];
    alert(`"${randomWord}" (only you can see this!)`);
  });
  document.body.append(button);
}

export function toggleSkribbl() {
  const frame = document.getElementById('skribbl');
  frame.src = frame.src === SKRIBBL_URL ? '' : SKRIBBL_URL;
}

function spawnIframe(attrs, xPos = 0, yPos = 0) {
  const el = Object.assign(document.createElement('iframe'), attrs);
  el.className = 'positionable';
  el.style.left = `${xPos}px`;
  el.style.top = `${yPos}px`;
  document.body.append(el);
  return el;
}

const twitchUrl = (streamerId, autoplay) =>
  `https://player.twitch.tv/?channel=${encodeURIComponent(streamerId)}` +
  `&parent=${location.hostname}&autoplay=${autoplay}`;

export function spawnTwitch(streamerId = 'vgtv_melee', xPos = 0, yPos = 0) {
  return spawnIframe(
    { id: 'twitchPlayer', src: twitchUrl(streamerId, false), width: 400, height: 300, allowFullscreen: true },
    xPos,
    yPos,
  );
}

export function setTwitch(streamerId) {
  const player = document.getElementById('twitchPlayer') ?? spawnTwitch(streamerId);
  player.src = twitchUrl(streamerId, true);
}

export function spawnYoutubeIframe(videoId, xPos, yPos) {
  return spawnIframe(
    {
      id: 'youtubeId',
      src: `https://www.youtube.com/embed/${videoId}`,
      width: 400,
      height: 300,
      allow: 'autoplay; encrypted-media',
      allowFullscreen: true,
    },
    xPos,
    yPos,
  );
}
