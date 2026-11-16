const socket = io();
const joinForm = document.getElementById('join-form');
const joinPanel = document.getElementById('join-panel');
const callPanel = document.getElementById('call-panel');
const leaveRoomBtn = document.getElementById('leave-room');
const localVideo = document.getElementById('local-video');
const remoteVideos = document.getElementById('remote-videos');
const participantList = document.getElementById('participant-list');
const roomLabel = document.getElementById('room-label');
const connectionStatus = document.getElementById('connection-status');

const peers = new Map();
const userMap = new Map();
let localStream = null;
let currentRoomId = null;
let currentUser = null;

function updateParticipantList(members) {
  participantList.innerHTML = '';

  members.forEach((member) => {
    const item = document.createElement('li');
    const name = document.createElement('span');
    const icon = document.createElement('span');

    name.textContent = member.userName;
    icon.className = 'dot';

    item.append(name, icon);
    participantList.appendChild(item);
  });
}

function renderRoomState(members) {
  updateParticipantList(members);

  members.forEach(({ socketId, userName }) => {
    userMap.set(socketId, userName);
  });
}

function setConnectionStatus(value) {
  connectionStatus.textContent = value;
}

function addLocalStream(stream) {
  localStream = stream;
  localVideo.srcObject = stream;
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    addLocalStream(stream);
  } catch (error) {
    console.error('Camera access failed:', error);
    setConnectionStatus('Camera access blocked');
  }
}

function createRemoteVideoElement(socketId) {
  const wrapper = document.createElement('div');
  wrapper.className = 'remote-video-card';
  wrapper.dataset.socketId = socketId;

  const video = document.createElement('video');
  video.autoplay = true;
  video.playsInline = true;
  video.muted = false;

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = userMap.get(socketId) || 'Peer';

  wrapper.append(video, label);
  remoteVideos.appendChild(wrapper);

  return { wrapper, video };
}

function ensurePeer(remoteId, userName, initiator = true) {
  if (peers.has(remoteId)) {
    return peers.get(remoteId);
  }

  const peer = new SimplePeer({
    initiator,
    trickle: true,
    stream: localStream,
  });

  peer.on('signal', (signal) => {
    socket.emit('signal-peer', {
      targetId: remoteId,
      signal,
    });
  });

  peer.on('stream', (remoteStream) => {
    let remoteItem = remoteVideos.querySelector(`[data-socket-id="${remoteId}"]`);
    if (!remoteItem) {
      remoteItem = createRemoteVideoElement(remoteId).wrapper;
    }

    const video = remoteItem.querySelector('video');
    video.srcObject = remoteStream;
  });

  peer.on('connect', () => {
    setConnectionStatus('Connected');
  });

  peer.on('error', (error) => {
    console.error('Peer error:', error);
    setConnectionStatus('Connection error');
  });

  peer.on('close', () => {
    const remoteElement = remoteVideos.querySelector(`[data-socket-id="${remoteId}"]`);
    if (remoteElement) remoteElement.remove();
    peers.delete(remoteId);
  });

  peers.set(remoteId, peer);

  return peer;
}

function joinRoom(roomId, userName) {
  currentRoomId = roomId;
  currentUser = userName;
  roomLabel.textContent = `Room: ${roomId}`;

  joinPanel.classList.add('hidden');
  callPanel.classList.remove('hidden');

  socket.emit('join-room', { roomId, userName });
  setConnectionStatus('Connecting');
}

joinForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const roomId = document.getElementById('room-name').value.trim();
  const userName = document.getElementById('user-name').value.trim();

  if (!roomId || !userName) return;

  await startCamera();
  joinRoom(roomId, userName);
});

leaveRoomBtn.addEventListener('click', () => {
  socket.disconnect();
  window.location.reload();
});

socket.on('connect', () => {
  setConnectionStatus('Ready');
});

socket.on('room-members', ({ members }) => {
  renderRoomState(members);

  members.forEach(({ socketId, userName }) => {
    if (socketId !== socket.id && socket.id < socketId) {
      ensurePeer(socketId, userName, true);
    }
  });
});

socket.on('user-joined', ({ socketId, userName }) => {
  if (socketId === socket.id) return;

  userMap.set(socketId, userName);

  if (socket.id < socketId) {
    ensurePeer(socketId, userName, true);
  }
});

socket.on('peer-signal', ({ fromId, signal }) => {
  let peer = peers.get(fromId);

  if (!peer) {
    peer = ensurePeer(fromId, userMap.get(fromId) || 'Peer', false);
  }

  peer.signal(signal);
});

socket.on('user-left', ({ socketId }) => {
  const peer = peers.get(socketId);
  if (peer) {
    peer.destroy();
    peers.delete(socketId);
  }

  const remoteElement = remoteVideos.querySelector(`[data-socket-id="${socketId}"]`);
  if (remoteElement) remoteElement.remove();

  userMap.delete(socketId);
  renderRoomState(Array.from(userMap.entries()).map(([socketIdValue, userName]) => ({
    socketId: socketIdValue,
    userName,
  })));
});

window.addEventListener('beforeunload', () => {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }
});
