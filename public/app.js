<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Facecall</title>
    <link rel="stylesheet" href="/style.css" />
  </head>
  <body>
    <div class="app-shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">Realtime video room</p>
          <h1>Facecall</h1>
        </div>

        <div class="topbar-actions">
          <button id="copy-room-link" class="secondary-btn" type="button">Copy room link</button>
          <button id="leave-room" class="secondary-btn danger" type="button">Leave room</button>
        </div>
      </header>

      <main id="join-panel" class="panel active">
        <div class="card">
          <div class="card-header">
            <h2>Join a video call</h2>
            <span class="badge">WebRTC</span>
          </div>

          <form id="join-form">
            <label>
              Your name
              <input id="user-name" type="text" maxlength="24" placeholder="Alex" required />
            </label>

            <label>
              Room name
              <input id="room-name" type="text" maxlength="30" placeholder="demo-room" required />
            </label>

            <button type="submit">Join call</button>
          </form>
        </div>
      </main>

      <section id="call-panel" class="panel hidden">
        <div class="status-bar">
          <span id="connection-status">Ready</span>
          <span id="room-label">Room: —</span>
        </div>

        <div class="call-content">
          <div class="video-column">
            <div class="video-grid">
              <div class="video-card local-card">
                <video id="local-video" autoplay muted playsinline></video>
                <div class="label">You</div>
              </div>

              <div id="remote-videos" class="remote-videos"></div>
            </div>

            <div class="controls-bar">
              <button id="toggle-mic" class="control-btn" type="button">Mic on</button>
              <button id="toggle-video" class="control-btn" type="button">Camera on</button>
            </div>
          </div>

          <aside class="side-panel">
            <div class="participants-panel">
              <h3>Participants</h3>
              <ul id="participant-list"></ul>
            </div>

            <div class="chat-panel">
              <h3>Chat</h3>
              <div id="chat-messages" class="chat-messages"></div>
              <form id="chat-form" class="chat-form">
                <input id="chat-input" type="text" maxlength="240" placeholder="Type a message..." />
                <button type="submit">Send</button>
              </form>
            </div>
          </aside>
        </div>
      </section>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/simple-peer@9.11.1/simplepeer.min.js"></script>
    <script src="/app.js"></script>
  </body>
</html>
