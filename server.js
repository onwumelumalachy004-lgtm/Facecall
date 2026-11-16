const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

const rooms = new Map();
const membersByRoom = new Map();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'Facecall server is running' });
});

function getRoomMembers(roomId) {
  const members = membersByRoom.get(roomId) || new Map();
  return Array.from(members.entries()).map(([socketId, userName]) => ({
    socketId,
    userName,
  }));
}

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, userName }) => {
    if (!roomId || !userName) {
      return;
    }

    const safeRoomId = roomId.trim();
    const safeUserName = userName.trim() || 'Guest';

    socket.join(safeRoomId);
    socket.data.roomId = safeRoomId;
    socket.data.userName = safeUserName;

    if (!membersByRoom.has(safeRoomId)) {
      membersByRoom.set(safeRoomId, new Map());
    }

    const roomMembers = membersByRoom.get(safeRoomId);
    roomMembers.set(socket.id, safeUserName);

    const memberList = getRoomMembers(safeRoomId);

    io.to(safeRoomId).emit('room-members', {
      members: memberList,
    });

    socket.to(safeRoomId).emit('user-joined', {
      socketId: socket.id,
      userName: safeUserName,
    });
  });

  socket.on('signal-peer', ({ targetId, signal }) => {
    if (!targetId) return;
    socket.to(targetId).emit('peer-signal', {
      fromId: socket.id,
      signal,
    });
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;

    if (!roomId) return;

    const roomMembers = membersByRoom.get(roomId);
    if (!roomMembers) return;

    roomMembers.delete(socket.id);

    if (roomMembers.size === 0) {
      membersByRoom.delete(roomId);
      rooms.delete(roomId);
    } else {
      io.to(roomId).emit('user-left', { socketId: socket.id });
      io.to(roomId).emit('room-members', {
        members: getRoomMembers(roomId),
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Facecall server listening on http://localhost:${PORT}`);
});
