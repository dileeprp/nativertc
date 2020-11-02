const express = require("express");
const app = express();

let broadcaster={};
let room={};
const port = 4000;

const http = require("http");
const server = http.createServer(app);

const io = require("socket.io")(server);
app.use(express.static(__dirname + "/public"));

io.sockets.on("error", e => console.log(e));
io.sockets.on("connection", socket => {

  socket.on('join', (roomId) => {
    const roomClients = io.sockets.adapter.rooms[roomId] || { length: 0 }
    const numberOfClients = roomClients.length

    // These events are emitted only to the sender socket.
    if (numberOfClients == 0) {
      console.log(`Creating room ${roomId} and emitting room_created socket event`)
      socket.join(roomId)
      broadcaster[roomId]=socket.id;
      socket.emit('room_created', roomId)
    } else if (numberOfClients > 0) {
      console.log(`Joining room ${roomId} and emitting room_joined socket event`)
      socket.join(roomId)
      room[socket.id]=roomId;
      socket.emit('room_joined', roomId)
    } else if(numberOfClients>=60){
      console.log(`Can't join room ${roomId}, emitting full_room socket event`)
      socket.emit('full_room', roomId)
    }
  })
  
  socket.on("watcher", (roomId) => {
    socket.to(broadcaster[roomId]).emit("watcher", socket.id,);
  });
  socket.on("offer", (id, message) => {
    socket.to(id).emit("offer", socket.id, message);
  });
  socket.on("answer", (id, message,stream) => {
    socket.to(id).emit("answer", socket.id, message,stream);
  });
  socket.on("candidate", (id, message) => {
    socket.to(id).emit("candidate", socket.id, message);
  });
  socket.on("disconnectp", (roomId) => {
    socket.to(broadcaster[roomId]).emit("disconnectPeer", socket.id);
  });

  socket.on("disconnectr", (roomId) => {
    console.log("time")
    socket.to(broadcaster[roomId]).emit("disconnectPeer", socket.id);
  });
  
  socket.on("message", (data) => {
    socket.broadcast.emit("message",data);
  });

  
  socket.on("disconnect",(reason)=>{
    socket.to(broadcaster[room[socket.id]]).emit("disconnectPeer", socket.id);
  
  });

  



});
server.listen(port, () => console.log(`Server is running on port ${port}`));