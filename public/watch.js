let peerConnection;
let flag=1;
var room;
const config = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"]
    } ,
    
  ]
};
const socket = io.connect(window.location.origin);
const video = document.getElementById("remote-video");
const myvideo = document.getElementById("myvideo");
const enableAudioButton = document.querySelector("#enable-audio");
var mute=true;

enableAudioButton.addEventListener("click", enableAudio)


// Media contrains
const constraints = {
 audio: true,
  video: { width: { min: 640, ideal: 1280, max: 1280 },
    height: { min: 480, ideal: 720 ,max:720},facingMode: "user"}
};

//get media from  camera

async function asyncCall() {
  room=prompt("Enter the room no")

  await  navigator.mediaDevices
  .getUserMedia(constraints).
  then(
  stream => (myvideo.srcObject = stream),
  err => console.log(err)
);
}

asyncCall();

socket.on('room_joined', async () => {
  console.log('Socket event callback: room_joined')
  socket.emit('watcher', room)
})


socket.on("offer", (id, description) => {
    peerConnection = new RTCPeerConnection(config);
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("candidate", id, event.candidate);
        }
    };
    peerConnection.ontrack = event => {
    video.srcObject = event.streams[0];
  };
    navigator.mediaDevices
        .getUserMedia({audio: {echoCancellation: true,sampleSize: 8,},
  video: { width: 640, height:480,facingMode: "user"}})
        .then(stream => {
            myvideo.srcObject = stream;
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
        })
        .then(peerConnection.setRemoteDescription(description))
        .then(() => peerConnection.createAnswer())
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
            socket.emit("answer", id, peerConnection.localDescription);
        })
        .catch(error => console.error(error));
});


socket.on("message", (data) => {
  console.log("Broadcaster "+data);
  video.remove();
});

socket.on("candidate", (id, candidate) => {
  peerConnection
    .addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => console.error(e));
});

socket.on("connect", () => {
  
    console.log("Connected new");
  socket.emit("join",room);

  
});

socket.on("broadcaster", () => {
  socket.emit("watcher");
});

socket.on("disconnectPeer", () => {
  peerConnection.close();
});

window.onunload = window.onbeforeunload = () => {

  socket.emit("disconnectp",room);

  socket.close();
};

socket.on("connect_error",(reason)=>{
  console.log("Connection error");
  socket.emit("disconnectp",room);
});
socket.on("disconnect",(reason)=>{
  socket.emit("disconnectp",room);
});

socket.on('reconnect', (attemptNumber) => {
  // ...
  console.log("reconnect "+attemptNumber);
});

socket.on('reconnect_attempt', (attemptNumber) => {
  // ...
  console.log("reconnect attempt"+attemptNumber);
});

socket.on('reconnecting', (attemptNumber) => {
  // ...
  console.log("reconnecting"+attemptNumber);
});

socket.on('reconnect_error', (error) => {
  // ...
  console.log("reconnect erro"+error);
});

socket.on('reconnect_failed', () => {
  // ...
  console.log("reconnect failed");
});
function  enableAudio ( )  {

  if(mute==true){
        console.log("Enabling audio")
        video.muted=false;
        mute=false;
  }
  else {
        console.log("Disabling audio")
        video.muted=true;
        mute=true;
  }
}