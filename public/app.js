const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

const PORT = process.env.PORT || 3000;
const roomMembers = new Map();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'Facecall server is running' });
});

function getRoomMembers(roomId) {
  const members = roomMembers.get(roomId) || new Map();
  return Array.from(members.entries()).map(([socketId, userName]) => ({
    socketId,
    userName,
  }));
}

function notifyRoomMembers(roomId) {
  io.to(roomId).emit('room-members', {
    members: getRoomMembers(roomId),
  });
}

function removeSocketFromRoom(socket) {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  const members = roomMembers.get(roomId);
  if (!members) return;

  members.delete(socket.id);

  if (members.size === 0) {
    roomMembers.delete(roomId);
  } else {
    notifyRoomMembers(roomId);
    io.to(roomId).emit('system-message', {
      userName: 'System',
      text: `${socket.data.userName || 'Someone'} left the room`,
    });
  }

  socket.leave(roomId);
  socket.data.roomId = null;
  socket.data.userName = null;
}

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, userName }) => {
    if (!roomId || !userName) return;

    const safeRoomId = String(roomId).trim();
    const safeUserName = String(userName).trim() || 'Guest';

    if (socket.data.roomId && socket.data.roomId !== safeRoomId) {
      removeSocketFromRoom(socket);
    }

    socket.join(safeRoomId);
    socket.data.roomId = safeRoomId;
    socket.data.userName = safeUserName;

    if (!roomMembers.has(safeRoomId)) {
      roomMembers.set(safeRoomId, new Map());
    }

    const members = roomMembers.get(safeRoomId);
    members.set(socket.id, safeUserName);

    io.to(safeRoomId).emit('system-message', {
      userName: 'System',
      text: `${safeUserName} joined the room`,
    });

    notifyRoomMembers(safeRoomId);

    socket.to(safeRoomId).emit('user-joined', {
      socketId: socket.id,
      userName: safeUserName,
    });
  });

  socket.on('leave-room', () => {
    removeSocketFromRoom(socket);
  });

  socket.on('signal-peer', ({ targetId, signal }) => {
    if (!targetId) return;

    socket.to(targetId).emit('peer-signal', {
      fromId: socket.id,
      signal,
    });
  });

  socket.on('chat-message', ({ text }) => {
    const roomId = socket.data.roomId;
    const userName = socket.data.userName || 'Guest';

    if (!roomId || !text) return;

    io.to(roomId).emit('chat-message', {
      userName,
      text: String(text).trim(),
    });
  });

  socket.on('disconnect', () => {
    removeSocketFromRoom(socket);
  });
});

server.listen(PORT, () => {
  console.log(`Facecall server listening on http://localhost:${PORT}`);
});
