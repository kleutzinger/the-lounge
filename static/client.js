function init() {
  addCharades();
  // console.log("Connecting to signaling server");
  signaling_socket = io();

  signaling_socket.on('connect', function() {
    // console.log("Connected to signaling server");
    setup_local_media(function() {
      /* once the user has given us access to their
                         * microphone/camcorder, join the channel and start peering up */
      join_chat_channel(DEFAULT_CHANNEL, { customId: 'localUser' });
    });
  });
  signaling_socket.on('disconnect', function() {
    // console.log("Disconnected from signaling server");
    /* Tear down all of our peer connections and remove all the
                     * media divs when we disconnect */
    for (peer_id in peer_media_elements) {
      peer_media_elements[peer_id].remove();
    }
    for (peer_id in peers) {
      peers[peer_id].close();
    }

    peers = {};
    peer_media_elements = {};
  });
  function join_chat_channel(channel, userdata) {
    signaling_socket.emit('join', { channel: channel, userdata: userdata });
  }
  function part_chat_channel(channel) {
    signaling_socket.emit('part', channel);
  }

  $('#globalText').click(() => {
    signaling_socket.emit('updateGlobalText', $('#globalText').val());
  });

  signaling_socket.on('updateGlobalText', (data) => {
    $('#globalText').val(data);
    //eval(data);
  });

  function updateMyAvatar() {
    signaling_socket.emit('updateSelf', { x: my_X, y: my_Y, width:guiOptions.width});
    if(local_media != null) {
      local_media[0].volume = 0;
    }
    setTimeout(updateMyAvatar, 200);
  }
  updateMyAvatar();

  function updateMyAvatarLocal() {
    let movementAmount = 10;
    if (guiOptions['godMode']) movementAmount = 20;
    if (leftHeld) {
      my_X -= movementAmount;
    }
    if (rightHeld) {
      my_X += movementAmount;
    }
    if (upHeld) {
      my_Y -= movementAmount;
    }
    if (downHeld) {
      my_Y += movementAmount;
    }
    if (joystick) {
      let joystickPos = joystick.getPosition();
      my_X += joystickPos.x * movementAmount;
      my_Y += joystickPos.y * movementAmount;
    }
    if (!guiOptions['godMode']) {
      let minX = 0;
      let minY = 0;
      my_X = my_X < minX ? minX : my_X;
      my_Y = my_Y < minY ? minY : my_Y;
      let maxX = 5000 - 320 - 200;
      let maxY = 3000 - 240 - 200;
      my_X = my_X > maxX ? maxX : my_X;
      my_Y = my_Y > maxY ? maxY : my_Y;
    }
    if (local_media != null) {
      local_media.attr("class","positionable");
      local_media[0].style.left = '' + my_X + 'px';
      local_media[0].style.top = '' + my_Y + 'px';
      let qtrNametagWidth = parseInt($('#myNametag').css('width')) / 4;
      $('#myNametag').css({
        left : `${my_X - qtrNametagWidth}px`,
        top  : `${my_Y - 200}px`
      });
      local_media[0].style.width = '' + guiOptions["width"] + 'px';
      if (!isScrolledIntoView(local_media[0])) local_media[0].scrollIntoView();
    }
    setTimeout(updateMyAvatarLocal, 20);
  }
  updateMyAvatarLocal();

  /** 
                * When we join a group, our signaling server will send out 'addPeer' events to each pair
                * of users in the group (creating a fully-connected graph of users, ie if there are 6 people
                * in the channel you will connect directly to the other 5, so there will be a total of 15 
                * connections in the network). 
                */
  signaling_socket.on('addPeer', function(config) {
    // console.log('Signaling server said to add peer:', config);
    var peer_id = config.peer_id;
    if (peer_id in peers) {
      /* This could happen if the user joins multiple channels where the other peer is also in. */
      // console.log("Already connected to peer ", peer_id);
      return;
    }
    var peer_connection = new RTCPeerConnection(
      { iceServers: ICE_SERVERS },
      {
        optional : [ { DtlsSrtpKeyAgreement: true } ]
      } /* this will no longer be needed by chrome
                                                                        * eventually (supposedly), but is necessary 
                                                                        * for now to get firefox to talk to chrome */
    );
    peers[peer_id] = peer_connection;
    peerAvatars[peer_id] = config['avatar'];

    peer_connection.onicecandidate = function(event) {
      if (event.candidate) {
        signaling_socket.emit('relayICECandidate', {
          peer_id       : peer_id,
          ice_candidate : {
            sdpMLineIndex : event.candidate.sdpMLineIndex,
            candidate     : event.candidate.candidate
          }
        });
      }
    };
    peer_connection.onaddstream = function(event) {
      // console.log("onAddStream", event);
      var remote_media = USE_VIDEO ? $('<video>') : $('<audio>');
      remote_media.attr('autoplay', 'autoplay');
      remote_media.attr('id', peer_id);
      if (MUTE_AUDIO_BY_DEFAULT) {
        remote_media.attr('muted', 'true');
      }
      remote_media.attr('controls', '');
      peer_media_elements[peer_id] = remote_media;
      peer_media_elements[peer_id][0].volume = 0;
      $('body').append(remote_media);
      attachMediaStream(remote_media[0], event.stream);
    };

    /* Add our local stream */
    // peer_connection.addStream(local_media_stream);

    try {
      let camVideoTrack = local_media_stream.getVideoTracks()[0];
      let camAudioTrack = local_media_stream.getAudioTracks()[0];
      let videoSender = peer_connection.addTrack(
        camVideoTrack,
        local_media_stream
      );
      videoSenders.push(videoSender);
      if (camAudioTrack) {
        let audioSender = peer_connection.addTrack(
          camAudioTrack,
          local_media_stream
        );
        audioSenders.push(audioSender);
      }
    } catch (e) {
      console.log(e);
    }

    /* Only one side of the peer connection should create the
                     * offer, the signaling server picks one to be the offerer. 
                     * The other user will get a 'sessionDescription' event and will
                     * create an offer, then send back an answer 'sessionDescription' to us
                     */
    if (config.should_create_offer) {
      // console.log("Creating RTC offer to ", peer_id);
      peer_connection.createOffer(
        function(local_description) {
          // console.log("Local offer description is: ", local_description);
          peer_connection.setLocalDescription(
            local_description,
            function() {
              signaling_socket.emit('relaySessionDescription', {
                peer_id             : peer_id,
                session_description : local_description
              });
              // console.log("Offer setLocalDescription succeeded");
            },
            function() {
              Alert('Offer setLocalDescription failed!');
            }
          );
        },
        function(error) {
          // console.log("Error sending offer: ", error);
        }
      );
    }
  });

  /** 
                 * Peers exchange session descriptions which contains information
                 * about their audio / video settings and that sort of stuff. First
                 * the 'offerer' sends a description to the 'answerer' (with type
                 * "offer"), then the answerer sends one back (with type "answer").  
                 */
  signaling_socket.on('sessionDescription', function(config) {
    // console.log('Remote description received: ', config);
    var peer_id = config.peer_id;
    var peer = peers[peer_id];
    var remote_description = config.session_description;
    // console.log(config.session_description);

    var desc = new RTCSessionDescription(remote_description);
    var stuff = peer.setRemoteDescription(
      desc,
      function() {
        // console.log("setRemoteDescription succeeded");
        if (remote_description.type == 'offer') {
          // console.log("Creating answer");
          peer.createAnswer(
            function(local_description) {
              // console.log("Answer description is: ", local_description);
              peer.setLocalDescription(
                local_description,
                function() {
                  signaling_socket.emit('relaySessionDescription', {
                    peer_id             : peer_id,
                    session_description : local_description
                  });
                  // console.log("Answer setLocalDescription succeeded");
                },
                function() {
                  Alert('Answer setLocalDescription failed!');
                }
              );
            },
            function(error) {
              // console.log("Error creating answer: ", error);
              // console.log(peer);
            }
          );
        }
      },
      function(error) {
        // console.log("setRemoteDescription error: ", error);
      }
    );
    // console.log("Description Object: ", desc);
  });

  // This function is called whenveer the server sends an update
  // for an object in the room. It's called once for each object
  // as often as the server updates (200ms at time of writing)
  signaling_socket.on('updateObject', function(config) {

    // check if we already have this object, if so, update it
    if (config.id in serverObjects) {
      let obj = serverObjects[config.id];
      let av = config['avatar'];
      // copy all properties from the server onto our local object
      // don't overwrite it so that we keep any extra properties that we
      // added locally
      for (let propertyName in config) {
        serverObjects[config.id][propertyName] = config[propertyName];
      }
    } // if we don't have the object, create it
    else {
      // since it's a new object, just use the config object and
      // modify that
      serverObjects[config.id] = config;

      // custom initializations for different object types
      if(config.type == "user") {
        if (config.peer_id == signaling_socket.id) {
          config.self = true;
        }
      }
      if(config.type == "iframe") {
        config.el = $('<iframe>')
          .attr({
            src  : config.url,
            class : "positionable"
          });
        $('body').append(config.el);
        config.prevUrl = config.url;
      }
      if(config.type == "image") {
        config.el = $('<iframe>')
          .attr({
            src  : config.url,
            class : "positionable"
          });
        $('body').append(config.el);
      }
    }

    // apply updates to the object element
    let so = serverObjects[config.id];
    
    // we normally get the object from the server before webrtc is finished
    // connecting, so if the element is null we check to see if the element
    // exists yet
    if (so.el == null && so.type == "user") {
      if (so.peer_id in peer_media_elements) {
        so.el = peer_media_elements[so.peer_id][0];
        peer_media_elements[so.peer_id].attr("class","positionable");
      }
      else {
        return;
      }
    }

    // dont update self, or if the el doesn't exist
    if (so.self || so.el == null) {
      return;
    }

    so.el.style.left = so["x"] + "px";
    so.el.style.top = so["y"] + "px";
    so.el.style.zIndex = so["z"];
    so.el.style.width = so["width"] + "px";
    so.el.style.height = so["height"] + "px";

    // type specific updates
    if(so.type == "user") {
      let dx = so.x - my_X;
      let dy = so.y - my_Y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      so.el.volume = Math.max(0, Math.min(1, (900 - distance) / 800));
      if (so.el.volume == 0 || guiOptions.receiveStreams == false) {
        so.el.srcObject.getTracks().forEach((t) => (t.enabled = false));
      } else {
        so.el.srcObject.getTracks().forEach((t) => (t.enabled = true));
      }
    }
    if(so.type == "iframe") {
      if (so.url != so.prevUrl) {
        so.prevUrl = so.url;
        so.el.src = so.url;
      }
    }
    if(so.type == "image") {
      if (so.url != so.prevUrl) {
        so.prevUrl = so.url;
        so.el.src = so.url;
      }
    }
  });

  /**
                 * The offerer will send a number of ICE Candidate blobs to the answerer so they 
                 * can begin trying to find the best path to one another on the net.
                 */
  signaling_socket.on('iceCandidate', function(config) {
    var peer = peers[config.peer_id];
    var ice_candidate = config.ice_candidate;
    peer.addIceCandidate(new RTCIceCandidate(ice_candidate));
  });

  /**
                 * When a user leaves a channel (or is disconnected from the
                 * signaling server) everyone will recieve a 'removePeer' message
                 * telling them to trash the media channels they have open for those
                 * that peer. If it was this client that left a channel, they'll also
                 * receive the removePeers. If this client was disconnected, they
                 * wont receive removePeers, but rather the
                 * signaling_socket.on('disconnect') code will kick in and tear down
                 * all the peer sessions.
                 */
  signaling_socket.on('removePeer', function(config) {
    // console.log('Signaling server said to remove peer:', config);
    var peer_id = config.peer_id;
    if (peer_id in peer_media_elements) {
      peer_media_elements[peer_id].remove();
    }
    if (peer_id in peers) {
      peers[peer_id].close();
    }

    delete peers[peer_id];
    delete peer_media_elements[config.peer_id];
    delete peerAvatars[peer_id];
  });
}

/***********************/
/** Local media stuff **/
/***********************/
function setup_local_media(callback, errorback) {
  if (local_media_stream != null) {
    /* ie, if we've already been initialized */
    if (callback) callback();
    return;
  }
  /* Ask user for permission to use the computers microphone and/or camera, 
                 * attach it to an <audio> or <video> tag if they give us access. */
  // console.log("Requesting access to local audio / video inputs");

  navigator.getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;

  attachMediaStream = function(element, stream) {
    // console.log('DEPRECATED, attachMediaStream will soon be removed.');
    element.srcObject = stream;
  };
  if (false) {
    navigator.getUserMedia(
      { audio: USE_AUDIO },
      function(stream) {
        /* user accepted access to a/v */
        // console.log("Access granted to audio/video");
        local_media_stream = stream;
        local_media = $('<audio>');
        local_media.attr('autoplay', 'autoplay');
        local_media.attr(
          'muted',
          'true'
        ); /* always mute ourselves by default */
        local_media.attr('controls', '');
        $('body').append(local_media);
        attachMediaStream(local_media[0], stream);

        if (callback) callback();
      },
      function() {
        /* user denied access to a/v */
        // console.log("Access denied for audio/video");
        alert(
          'You chose not to provide access to the camera/microphone, demo will not work.'
        );
        if (errorback) errorback();
      }
    );
  } else {
    navigator.getUserMedia(
      { audio: USE_AUDIO, video: USE_VIDEO },
      function(stream) {
        /* user accepted access to a/v */
        // console.log("Access granted to audio/video");
        local_media_stream = stream;
        local_media = USE_VIDEO ? $('<video>') : $('<audio>');
        local_media.attr('autoplay', 'autoplay');
        local_media.attr(
          'muted',
          'true'
        ); /* always mute ourselves by default */
        local_media.attr('id', 'myVideo');
        local_media.attr('controls', '');
        $('body').append(local_media);
        $('body').append('<p id="myNametag" class="nametag">id=myNametag</p>');
        attachMediaStream(local_media[0], stream);
        peer_media_elements[signaling_socket.id] = local_media;

        if (callback) callback();
      },
      function() {
        navigator.getUserMedia(
          { audio: USE_AUDIO },
          function(stream) {
            /* user accepted access to a/v */
            // console.log("Access granted to audio/video");
            local_media_stream = stream;
            local_media = $('<audio>');
            local_media.attr('autoplay', 'autoplay');
            local_media.attr(
              'muted',
              'true'
            ); /* always mute ourselves by default */
            local_media.attr('controls', '');
            $('body').append(local_media);
            attachMediaStream(local_media[0], stream);

            if (callback) callback();
          },
          function() {
            /* user denied access to a/v */
            // console.log("Access denied for audio/video");
            alert(
              'You chose not to provide access to the camera/microphone, demo will not work.'
            );
            if (errorback) errorback();
          }
        );
      }
    );
  }
}
