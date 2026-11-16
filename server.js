const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  pingInterval: 25000,
  pingTimeout: 20000,
  maxHttpBufferSize: 1e6,
});

const PORT = Number(process.env.PORT) || 3000;
const MAX_ROOM_SIZE = 8;
const MAX_MESSAGE_LENGTH = 1000;
const rooms = new Map();

app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (_req, res) => res.json({ ok: true }));

function cleanRoomId(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
}

function cleanName(value) {
  return String(value || '').trim().replace(/[<>]/g, '').slice(0, 32) || 'Guest';
}

function membersFor(roomId) {
  const room = rooms.get(roomId);
  return room ? [...room.entries()].map(([socketId, member]) => ({ socketId, userName: member.userName, micOn: member.micOn, cameraOn: member.cameraOn, handRaised: member.handRaised })) : [];
}

function emitMembers(roomId) {
  io.to(roomId).emit('room:members', membersFor(roomId));
}

function leaveRoom(socket) {
  const roomId = socket.data.roomId;
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (room) {
    room.delete(socket.id);
    if (room.size === 0) rooms.delete(roomId);
    else emitMembers(roomId);
  }
  socket.leave(roomId);
  socket.data.roomId = null;
  socket.data.userName = null;
}

io.on('connection', (socket) => {
  socket.on('room:join', (payload = {}, ack = () => {}) => {
    const roomId = cleanRoomId(payload.roomId);
    const userName = cleanName(payload.userName);
    if (!roomId) return ack({ ok: false, error: 'Use letters, numbers, hyphens, or underscores for the room name.' });
    if (socket.data.roomId === roomId) return ack({ ok: true, roomId, members: membersFor(roomId) });

    leaveRoom(socket);
    const room = rooms.get(roomId) || new Map();
    if (room.size >= MAX_ROOM_SIZE) return ack({ ok: false, error: `This room is full (maximum ${MAX_ROOM_SIZE} participants).` });

    const existing = membersFor(roomId);
    room.set(socket.id, { userName, micOn: true, cameraOn: true, handRaised: false });
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.userName = userName;
    ack({ ok: true, roomId, members: existing });
    emitMembers(roomId);
    socket.to(roomId).emit('chat:system', { text: `${userName} joined the call`, at: Date.now() });
  });

  socket.on('room:leave', () => leaveRoom(socket));

  socket.on('peer:signal', ({ targetId, signal } = {}) => {
    const roomId = socket.data.roomId;
    if (!roomId || !targetId || !rooms.get(roomId)?.has(targetId) || !signal || typeof signal !== 'object') return;
    io.to(targetId).emit('peer:signal', { fromId: socket.id, signal });
  });

  socket.on('member:state', ({ micOn, cameraOn, handRaised } = {}) => {
    const roomId = socket.data.roomId;
    const member = roomId && rooms.get(roomId)?.get(socket.id);
    if (!member) return;
    if (typeof micOn === 'boolean') member.micOn = micOn;
    if (typeof cameraOn === 'boolean') member.cameraOn = cameraOn;
    if (typeof handRaised === 'boolean') member.handRaised = handRaised;
    emitMembers(roomId);
  });

  socket.on('chat:send', ({ text } = {}) => {
    const roomId = socket.data.roomId;
    const message = String(text || '').trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!roomId || !message) return;
    io.to(roomId).emit('chat:message', { userName: socket.data.userName, text: message, at: Date.now() });
  });

  socket.on('disconnect', () => leaveRoom(socket));
});

server.listen(PORT, () => console.log(`Facecall listening on http://localhost:${PORT}`));
