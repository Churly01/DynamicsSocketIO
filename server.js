const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
const cors = require('cors');
const Crypto = require('crypto');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server,{
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
});

let rooms = {};

const generateId = () => {
  return Crypto.randomBytes(2).toString('hex');
};

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    rooms = Object.keys(rooms).reduce((acc, roomId) => {
      if (rooms[roomId].ownerId === socket.id) {
        socket.to(roomId).emit('roomDeleted');
        console.log('Room deleted: ' + roomId + 'With ID: ' + socket.id);
      } else {
        acc[roomId] = rooms[roomId];
      }
      return acc;
    }, {});
  });

  socket.on('kick', (room, user_id) => {
    if (rooms[room] && rooms[room].ownerId === socket.id) {
      io.to(user_id).emit('kicked');
      console.log('User kicked: ' + user_id + 'From room: ' + room + 'With ID: ' + socket.id);
    }
  });

  socket.on('create', (callback) => {
    let roomId = generateId(); // generate a 4 characters room ID
    while (rooms[roomId]) {
      roomId = generateId();
    }
    rooms[roomId] = {
      ownerId: socket.id,
      users: []
    };
    console.log('Room created: ' + roomId);
    socket.join(roomId);
    callback(roomId);
  });

  socket.on('refresh', (roomId, callback) => {
    if (rooms[roomId]) {
      callback(rooms[roomId].users);
    } else {
      callback([]);
    }
  });

  socket.on('leave', (roomId, name, callback) => {
    if (rooms[roomId]) {
      socket.leave(roomId);
      rooms[roomId].users = rooms[roomId].users.filter(user => user.id !== socket.id);
      console.log('Room left: ' + roomId + 'With ID: ' + socket.id + 'With name: ' + name);
      socket.to(roomId).emit('userLeft', rooms[roomId].users);
      callback(true);
    }
    else
      callback(false);

  });


  socket.on('join', (roomId, name, callback) => {
    if (rooms[roomId]) {
      socket.join(roomId);
      rooms[roomId].users.push({
        id: socket.id,
        name: name
      });
      console.log('Room joined: ' + roomId + 'With ID: ' + socket.id + 'With name: ' + name);
      socket.to(roomId).emit('userJoined', rooms[roomId].users);
      callback(true);
    } else {
      callback(false);
    }
  });

  socket.on('startTimer', (roomId, time) => {
    if (rooms[roomId] && rooms[roomId].ownerId === socket.id) {
      socket.to(roomId).emit('startTimer', time);
      console.log('Timer started: ' + roomId + 'With ID: ' + socket.id);
    }
  });

  socket.on('kick', (roomId, user_id) => {
    if (rooms[roomId] && rooms[roomId].ownerId === socket.id) {
      io.to(user_id).emit('kicked');
      console.log('User kicked: ' + user_id + 'From room: ' + roomId + 'With ID: ' + socket.id);
      rooms[roomId].users = rooms[roomId].users.filter(user => user.id !== user_id);
    }
  });


  socket.on('stopTimer', (roomId) => {
    if (rooms[roomId] && rooms[roomId].ownerId === socket.id) {
      socket.to(roomId).emit('stopTimer');
      console.log('Timer stopped: ' + roomId + 'With ID: ' + socket.id);
    }
  });
});
server.listen(4001, () => console.log('Listening on port 4001'));
