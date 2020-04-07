// prettier-ignore
const charadesWordlist = ['ping pong', 'snowball', 'roof', 'fly', 'fang', 'bicycle', 'bear', 'cape', 'puppet', 'piano', 'lipstick', 'salute', 'hula hoop', 'penguin', 'banana peel', 'whisper', 'popsicle', 'Frankenstein', 'earthquake', 'yo-yo', 'road', 'rain', 'alarm clock', 'dog leash', 'chop', 'pajamas', 'slam dunk', 'fiddle', 'seashell', 'jog', 'seesaw', 'nap', 'cheerleader', 'blind', 'beg', 'shopping cart', 'Michael Jackson', 'limbo', 'newspaper', 'twist', 'rhinoceros', 'cow', 'tickle', 'fetch', 'violin', 'cage', 'cello', 'braid', 'skateboard', 'stairs', 'trumpet', 'mop', 'shovel', 'money', 'soap', 'saddle', 'wink', 'tree', 'Spider Man', 'think', 'Airplane', 'Ears', 'Piano', 'Angry', 'Elephant', 'Pinch', 'Baby', 'Fish', 'Reach', 'Ball', 'Flick', 'Remote', 'Baseball', 'Football', 'Roll', 'Basketball', 'Fork', 'Sad', 'Bounce', 'Giggle', 'Scissors', 'Cat', 'Golf', 'Skip', 'Chicken', 'Guitar', 'Sneeze', 'Chimpanzee', 'Hammer', 'Spin', 'Clap', 'Happy', 'Spoon', 'Cough', 'Horns', 'Stomp', 'Cry', 'Joke', 'Stop', 'Dog', 'Mime', 'Tail', 'Drink', 'Penguin', 'Toothbrush', 'Drums', 'Phone', 'Wiggle', 'Duck', 'Photographer', 'Archer', 'Ghost', 'Rock star', 'Balance beam', 'Haircut', 'Shoelaces', 'Ballet', 'Halo', 'Sick', 'Balloon', 'Hiccup', 'Singer', 'Banana peel', 'Hot dog', 'Skateboard', 'Book', 'Hungry', 'Slippery', 'Braces', 'Hurt', 'Soccer', 'Button', 'Ice skating', 'Strong', 'Car', 'Karate', 'Stubbed toe', 'Cheers', 'Ladder', 'Sunshine', 'Clown', 'Light bulb', 'Surprise', 'Dinosaur', 'Limbo', 'Swing', 'Disco', 'Macarena', 'Sword', 'Dizzy', 'Paint', 'Tap dance', 'Fart', 'Pirate', 'Wheelbarrow', 'Fishing', 'Read', 'Wizard of Oz', 'Gallop', 'River dance']

function addCharades() {
  var el = $('<input/>')
    .attr({
      type  : 'button',
      id    : 'charadesButton',
      value : 'Charades!'
    })
    .click(() => {
      const random_index = Math.floor(Math.random() * charadesWordlist.length);
      alert(charadesWordlist[random_index]);
    });
  $('body').append(el);
}

function toggleSkribbl() {
  if(document.getElementById('skribbl').src != "https://skribbl.io/") {
    document.getElementById('skribbl').src = 'https://skribbl.io';
  }
  else {
    document.getElementById('skribbl').src = '';
  }
}