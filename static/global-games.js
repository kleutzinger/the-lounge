// prettier-ignore
const charadesWordlist = ['ping pong', 'snowball', 'roof', 'fly', 'fang', 'bicycle', 'bear', 'cape', 'puppet', 'piano', 'lipstick', 'salute', 'hula hoop', 'penguin', 'banana peel', 'whisper', 'popsicle', 'Frankenstein', 'earthquake', 'yo-yo', 'road', 'rain', 'alarm clock', 'dog leash', 'chop', 'pajamas', 'slam dunk', 'fiddle', 'seashell', 'jog', 'seesaw', 'nap', 'cheerleader', 'blind', 'beg', 'shopping cart', 'Michael Jackson', 'limbo', 'newspaper', 'twist', 'rhinoceros', 'cow', 'tickle', 'fetch', 'violin', 'cage', 'cello', 'braid', 'skateboard', 'stairs', 'trumpet', 'mop', 'shovel', 'money', 'soap', 'saddle', 'wink', 'tree', 'Spider Man', 'think']

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
