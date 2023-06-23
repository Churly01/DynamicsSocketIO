const io = require('socket.io-client');
const socket = io('http://localhost:4001');
let local_roomId;
// Function to create a room
function createRoom() {
  socket.emit('create', (roomId) => {
    console.log("Created room with ID: " + roomId);
    local_roomId = roomId;
  });
}

// Function to join a room
function joinRoom(roomId) {
  socket.emit('join', roomId, (success) => {
    if (success) {
      console.log("Successfully joined room " + roomId);
    } else {
      console.log("Failed to join room " + roomId);
    }
  });
}

// Function to start the timer
function startTimer(roomId, time) {
  socket.emit('startTimer', roomId, time);
}

// Listening to the timer start event
socket.on('startTimer', (time) => {
  console.log("Timer started at: " + new Date(time));
});

// Then you can use these functions to create or join a room or start the timer.

createRoom();

new Promise(r => setTimeout(r, 2000)).then(() => {
  joinRoom(local_roomId);
  startTimer(local_roomId, new Date().getTime());
});
