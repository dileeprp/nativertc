const peerConnections = {};
var flag=1;
let mdstream={};
const videoGrid = document.getElementById('video-grid')
const config = {
  iceServers: [
    { 
      "urls": "stun:stun.l.google.com:19302",
    },
    {
"urls": [
"turn:13.250.13.83:3478?transport=udp"
],
"username": "YzYNCouZM1mhqhmseWk6",
"credential": "YzYNCouZM1mhqhmseWk6"
}
  ]
};

const socket = io.connect(window.location.origin);
const myvideo = document.getElementById("myvideo");
const video = document.querySelector("video");

// Media contrains
const constraints = {
  video: { facingMode: "user" },
  // Uncomment to enable audio
  audio: {echoCancellation: true,sampleSize: 8,},
};

//get media from  camera
async function asyncCall() {

 await navigator.mediaDevices
  .getUserMedia(constraints).
  then(
  stream => (myvideo.srcObject = stream,socket.emit("broadcaster")),
  err => console.log(err)
);
  }

  asyncCall();
  //creating a rtc peer connection
  socket.on("watcher", id => {

  const peerConnection = new RTCPeerConnection(config);
  peerConnections[id] = peerConnection;
  let stream = myvideo.srcObject;
  stream.getTracks().forEach(track => peerConnections[id].addTrack(track, stream));

  peerConnections[id]
    .createOffer()
    .then(sdp => peerConnections[id].setLocalDescription(sdp))
    .then(() => {
      socket.emit("offer", id, peerConnections[id].localDescription);
    });
    
  peerConnections[id].onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };

});


socket.on("answer", (id, description) => {
  const video =document.createElement('video')
  peerConnections[id].setRemoteDescription(description);
  peerConnections[id].ontrack = event => {
    
    console.log("flag: "+ flag++)
    video.srcObject= event.streams[0];
    mdstream[id]=event.streams[0].id;
    
  };
  addVideoStream(video);
  
});


socket.on("candidate", (id, candidate) => {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("disconnectPeer", id => {
  console.log("diconnected");
  if(peerConnections[id]) 
  peerConnections[id].close();
  delete peerConnections[id];
  debugger;
  let video =document.getElementsByTagName('video')
  for(i=0;i<video.length;i++)
  {

      if(video[i].srcObject.id==mdstream[id])
      {
        video[i].remove();
      }
  }
});


window.onunload = window.onbeforeunload = () => {
  socket.emit("message","disconnect");
  socket.close();
};

function addVideoStream(video)
{
    console.log("video");
    video.addEventListener('loadedmetadata',() => {
      console.log("playing");
        video.play()
    })

    videoGrid.append(video)
}


