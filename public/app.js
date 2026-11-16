const socket = io({ autoConnect: true, reconnection: true, reconnectionAttempts: Infinity });
const $ = (id) => document.getElementById(id);
const els = {
  lobby: $('lobby'), meeting: $('meeting'), joinForm: $('join-form'), name: $('name'), room: $('room'), joinError: $('join-error'),
  roomTitle: $('room-title'), state: $('connection-state'), timer: $('call-timer'), grid: $('video-grid'), empty: $('empty-state'),
  people: $('people-list'), count: $('people-count'), chatLog: $('chat-log'), chatForm: $('chat-form'), chatInput: $('chat-input'),
  mic: $('mic-button'), camera: $('camera-button'), screen: $('share-screen-button'), hand: $('hand-button'), leave: $('leave-button'),
  copy: $('copy-link'), shareInvite: $('share-invite'), toast: $('toast'),
};
const peers = new Map();
const members = new Map();
let localStream;
let screenStream;
let roomId = '';
let userName = '';
let micOn = true;
let cameraOn = true;
let handRaised = false;
let startedAt = 0;
let timerHandle;
let toastHandle;
let joining = false;
const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

function setState(text, mode = '') { els.state.lastChild.textContent = ` ${text}`; els.state.className = `connection ${mode}`; }
function toast(text) { els.toast.textContent = text; els.toast.classList.add('visible'); clearTimeout(toastHandle); toastHandle = setTimeout(() => els.toast.classList.remove('visible'), 2400); }
function formatTime(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function updateTimer() { els.timer.textContent = formatTime(Math.floor((Date.now() - startedAt) / 1000)); }
function safeRoom(value) { return value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40); }
function getVideoTrack() { return screenStream?.getVideoTracks()[0] || localStream?.getVideoTracks()[0] || null; }

function addTile(id, name, stream, local = false) {
  let tile = document.querySelector(`[data-peer="${CSS.escape(id)}"]`);
  if (!tile) {
    tile = document.createElement('article'); tile.className = `tile${local ? ' local-tile' : ''}`; tile.dataset.peer = id;
    const video = document.createElement('video'); video.autoplay = true; video.playsInline = true; video.muted = local;
    const label = document.createElement('div'); label.className = 'tile-label';
    const status = document.createElement('span'); status.className = 'tile-status';
    tile.append(video, label, status); els.grid.append(tile);
  }
  tile.querySelector('video').srcObject = stream;
  tile.querySelector('.tile-label').textContent = local ? `${name} (You)` : name;
  els.empty.classList.toggle('hidden', els.grid.querySelectorAll('.tile').length > 1);
  return tile;
}
function removeTile(id) { document.querySelector(`[data-peer="${CSS.escape(id)}"]`)?.remove(); els.empty.classList.toggle('hidden', els.grid.querySelectorAll('.tile').length > 1); }

function renderMembers(list) {
  members.clear(); list.forEach((m) => members.set(m.socketId, m));
  els.people.replaceChildren();
  for (const m of list) {
    const li = document.createElement('li'); li.className = 'person';
    const avatar = document.createElement('span'); avatar.className = 'avatar'; avatar.textContent = (m.userName || '?').slice(0, 1).toUpperCase();
    const name = document.createElement('span'); name.className = 'person-name'; name.textContent = `${m.userName}${m.socketId === socket.id ? ' (you)' : ''}`;
    const flags = document.createElement('span'); flags.className = 'person-flags'; flags.textContent = `${m.micOn ? '♫' : '×'} ${m.cameraOn ? '▣' : '×'}${m.handRaised ? ' ✋' : ''}`;
    li.append(avatar, name, flags); els.people.append(li);
    if (m.socketId !== socket.id) {
      const tile = document.querySelector(`[data-peer="${CSS.escape(m.socketId)}"]`);
      if (tile) tile.querySelector('.tile-label').textContent = m.userName;
    }
  }
  els.count.textContent = String(list.length);
  els.empty.classList.toggle('hidden', list.length > 1);
  for (const [id, peer] of peers) if (!members.has(id)) { peer.close(); peers.delete(id); removeTile(id); }
}

function addChat({ userName: author, text, at, system = false }) {
  const row = document.createElement('div'); row.className = `chat-message${system ? ' system-message' : ''}`;
  if (!system) { const title = document.createElement('strong'); title.textContent = author || 'Guest'; row.append(title); }
  const body = document.createElement('p'); body.textContent = text;
  const time = document.createElement('time'); time.textContent = new Date(at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  row.append(body, time); els.chatLog.append(row); els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

function createPeer(remoteId, initiator) {
  if (peers.has(remoteId)) return peers.get(remoteId);
  const pc = new RTCPeerConnection(rtcConfig);
  const entry = { pc, pendingCandidates: [] };
  peers.set(remoteId, entry);
  if (localStream) for (const track of localStream.getAudioTracks()) pc.addTrack(track, localStream);
  const videoTrack = getVideoTrack();
  if (videoTrack) pc.addTrack(videoTrack, screenStream || localStream);
  pc.onicecandidate = ({ candidate }) => { if (candidate) socket.emit('peer:signal', { targetId: remoteId, signal: { candidate } }); };
  pc.ontrack = ({ streams }) => { if (streams[0]) addTile(remoteId, members.get(remoteId)?.userName || 'Guest', streams[0]); };
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'connected') setState('Connected', 'online');
    else if (pc.connectionState === 'failed') { setState('Connection failed', 'offline'); schedulePeerRetry(remoteId); }
    else if (pc.connectionState === 'disconnected') setState('Reconnecting…', 'offline');
    else if (pc.connectionState === 'closed') removeTile(remoteId);
  };
  if (initiator) pc.createOffer().then((offer) => pc.setLocalDescription(offer)).then(() => socket.emit('peer:signal', { targetId: remoteId, signal: { description: pc.localDescription } })).catch((e) => console.error('Offer failed', e));
  return entry;
}
function schedulePeerRetry(id) {
  const entry = peers.get(id); if (!entry || entry.retryTimer) return;
  entry.retryTimer = setTimeout(() => {
    if (!members.has(id) || !socket.connected) return;
    entry.pc.close(); peers.delete(id);
    if (socket.id < id) createPeer(id, true);
  }, 2500);
}
async function handleSignal({ fromId, signal }) {
  if (!members.has(fromId)) return;
  const entry = peers.get(fromId) || createPeer(fromId, false);
  try {
    if (signal.description) {
      await entry.pc.setRemoteDescription(signal.description);
      for (const candidate of entry.pendingCandidates.splice(0)) await entry.pc.addIceCandidate(candidate);
      if (signal.description.type === 'offer') {
        await entry.pc.setLocalDescription(await entry.pc.createAnswer());
        socket.emit('peer:signal', { targetId: fromId, signal: { description: entry.pc.localDescription } });
      }
    } else if (signal.candidate) {
      if (entry.pc.remoteDescription) await entry.pc.addIceCandidate(signal.candidate);
      else entry.pendingCandidates.push(signal.candidate);
    }
  } catch (error) { console.error('Signaling failed:', error); }
}

async function startCall(event) {
  event.preventDefault(); if (joining) return;
  joining = true; els.joinError.textContent = '';
  userName = els.name.value.trim().slice(0, 32) || 'Guest'; roomId = safeRoom(els.room.value);
  if (!roomId) { els.joinError.textContent = 'Room names can use letters, numbers, hyphens, and underscores.'; joining = false; return; }
  els.joinForm.querySelector('button').disabled = true;
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera and microphone require HTTPS or localhost.');
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  } catch (error) {
    els.joinError.textContent = error.name === 'NotAllowedError' ? 'Allow camera and microphone access, then try again.' : error.message || 'Could not access camera or microphone.';
    joining = false; els.joinForm.querySelector('button').disabled = false; return;
  }
  socket.emit('room:join', { roomId, userName }, (result) => {
    joining = false; els.joinForm.querySelector('button').disabled = false;
    if (!result?.ok) { stopLocalMedia(); els.joinError.textContent = result?.error || 'Could not join this room.'; return; }
    roomId = result.roomId; renderMembers(result.members || []); addTile(socket.id, userName, localStream, true);
    els.lobby.classList.add('hidden'); els.meeting.classList.remove('hidden'); els.roomTitle.textContent = roomId;
    const url = new URL(location.href); url.searchParams.set('room', roomId); history.replaceState({}, '', url);
    startedAt = Date.now(); updateTimer(); timerHandle = setInterval(updateTimer, 1000); setState('Waiting for people', 'online');
    for (const m of result.members || []) if (socket.id < m.socketId) createPeer(m.socketId, true);
  });
}
function stopLocalMedia() { if (screenStream) screenStream.getTracks().forEach((t) => t.stop()); screenStream = null; if (localStream) localStream.getTracks().forEach((t) => t.stop()); localStream = null; if (els.localVideo) els.localVideo.srcObject = null; }
function leaveCall() {
  if (!roomId && !localStream) return;
  socket.emit('room:leave'); for (const entry of peers.values()) { clearTimeout(entry.retryTimer); entry.pc.close(); } peers.clear(); stopLocalMedia();
  clearInterval(timerHandle); els.grid.replaceChildren(); els.people.replaceChildren(); els.chatLog.replaceChildren(); members.clear(); roomId = ''; handRaised = false;
  els.meeting.classList.add('hidden'); els.lobby.classList.remove('hidden'); els.roomTitle.textContent = ''; setState('Disconnected');
  const url = new URL(location.href); url.searchParams.delete('room'); history.replaceState({}, '', url);
}
async function copyInvite() {
  const invite = new URL(location.href); invite.searchParams.set('room', roomId || els.room.value);
  try { await navigator.clipboard.writeText(invite.toString()); toast('Invite link copied'); }
  catch { window.prompt('Copy this invite link:', invite.toString()); }
}
function publishState() { socket.emit('member:state', { micOn, cameraOn, handRaised }); }

els.joinForm.addEventListener('submit', startCall);
els.mic.addEventListener('click', () => { micOn = !micOn; localStream?.getAudioTracks().forEach((t) => { t.enabled = micOn; }); els.mic.classList.toggle('off', !micOn); els.mic.lastElementChild.textContent = micOn ? 'Mute' : 'Unmute'; publishState(); });
els.camera.addEventListener('click', () => { cameraOn = !cameraOn; localStream?.getVideoTracks().forEach((t) => { t.enabled = cameraOn; }); els.camera.classList.toggle('off', !cameraOn); els.camera.lastElementChild.textContent = cameraOn ? 'Stop video' : 'Start video'; document.querySelector(`[data-peer="${CSS.escape(socket.id)}"]`)?.classList.toggle('video-off', !cameraOn); publishState(); });
els.screen.addEventListener('click', async () => {
  if (!screenStream) {
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = screenStream.getVideoTracks()[0];
      for (const { pc } of peers.values()) { const sender = pc.getSenders().find((s) => s.track?.kind === 'video'); if (sender) await sender.replaceTrack(track); }
      const tile = document.querySelector(`[data-peer="${CSS.escape(socket.id)}"] video`); if (tile) tile.srcObject = screenStream;
      track.onended = () => els.screen.click(); els.screen.classList.add('active'); els.screen.lastElementChild.textContent = 'Stop sharing';
    } catch (e) { if (e.name !== 'NotAllowedError') toast('Screen sharing is unavailable'); }
  } else {
    screenStream.getTracks().forEach((t) => t.stop()); screenStream = null;
    const track = localStream?.getVideoTracks()[0];
    for (const { pc } of peers.values()) { const sender = pc.getSenders().find((s) => s.track?.kind === 'video'); if (sender && track) await sender.replaceTrack(track); }
    const tile = document.querySelector(`[data-peer="${CSS.escape(socket.id)}"] video`); if (tile) tile.srcObject = localStream;
    els.screen.classList.remove('active'); els.screen.lastElementChild.textContent = 'Share screen';
  }
});
els.hand.addEventListener('click', () => { handRaised = !handRaised; els.hand.classList.toggle('active', handRaised); els.hand.lastElementChild.textContent = handRaised ? 'Lower hand' : 'Raise hand'; publishState(); });
els.leave.addEventListener('click', leaveCall); $('leave-room').addEventListener('click', leaveCall);
els.copy.addEventListener('click', copyInvite); els.shareInvite.addEventListener('click', copyInvite);
els.chatForm.addEventListener('submit', (e) => { e.preventDefault(); const text = els.chatInput.value.trim(); if (!text || !roomId) return; socket.emit('chat:send', { text }); els.chatInput.value = ''; });

socket.on('connect', () => { setState(roomId ? 'Rejoining…' : 'Ready', 'online'); if (roomId && localStream) socket.emit('room:join', { roomId, userName }, (r) => { if (!r?.ok) { toast(r?.error || 'Could not reconnect'); return; } for (const m of r.members || []) if (socket.id < m.socketId) createPeer(m.socketId, true); }); });
socket.on('disconnect', () => { setState('Connection lost', 'offline'); });
socket.on('room:members', renderMembers);
socket.on('peer:signal', handleSignal);
socket.on('chat:message', addChat);
socket.on('chat:system', ({ text, at }) => addChat({ text, at, system: true }));
socket.on('connect_error', () => setState('Server unavailable', 'offline'));
window.addEventListener('beforeunload', () => { socket.emit('room:leave'); stopLocalMedia(); });

const roomParam = new URLSearchParams(location.search).get('room'); if (roomParam) els.room.value = roomParam;
