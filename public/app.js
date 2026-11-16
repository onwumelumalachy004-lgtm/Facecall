* {
  box-sizing: border-box;
}

:root {
  --bg: #0a1020;
  --bg-2: #121b2d;
  --panel: rgba(17, 25, 40, 0.9);
  --panel-border: rgba(148, 163, 184, 0.2);
  --text: #edf2ff;
  --muted: #a7b7d7;
  --primary: #54d2ff;
  --primary-2: #7c6cff;
  --success: #34d399;
  --danger: #f87171;
}

body {
  margin: 0;
  font-family: Inter, 'Segoe UI', sans-serif;
  background: radial-gradient(circle at top, #13213d, var(--bg));
  color: var(--text);
  min-height: 100vh;
}

button,
input {
  font: inherit;
}

.app-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px 48px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 32px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--muted);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-size: 12px;
}

h1,
h2,
h3,
p {
  margin: 0;
}

h1 {
  font-size: clamp(2rem, 4vw, 3rem);
}

.card,
.status-bar,
.video-card,
.participants-panel {
  background: var(--panel);
  border: 1px solid var(--panel-border);
  border-radius: 18px;
  box-shadow: 0 25px 50px rgba(15, 23, 42, 0.35);
}

.join-panel {
  display: grid;
  place-items: center;
  min-height: 60vh;
}

.card {
  width: min(520px, 100%);
  padding: 28px;
}

.card h2 {
  margin-bottom: 20px;
  font-size: 1.7rem;
}

form {
  display: grid;
  gap: 18px;
}

label {
  display: grid;
  gap: 8px;
  color: var(--muted);
  font-weight: 600;
}

input {
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.15);
  color: var(--text);
  border-radius: 12px;
  padding: 12px 14px;
}

button {
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), var(--primary-2));
  color: #09111d;
  font-weight: 800;
  padding: 12px 18px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

button:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(84, 210, 255, 0.3);
}

.secondary-btn {
  background: rgba(15, 23, 42, 0.8);
  color: var(--text);
  border: 1px solid var(--panel-border);
}

.hidden {
  display: none !important;
}

.call-panel {
  display: grid;
  gap: 20px;
}

.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  color: var(--muted);
}

.video-grid {
  display: grid;
  grid-template-columns: minmax(260px, 1.1fr) minmax(260px, 1fr);
  gap: 20px;
}

.video-card {
  position: relative;
  overflow: hidden;
  min-height: 360px;
  background: rgba(10, 16, 32, 0.8);
}

video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
}

.local-card {
  border: 1px solid rgba(84, 210, 255, 0.4);
}

.label {
  position: absolute;
  left: 14px;
  bottom: 14px;
  background: rgba(15, 23, 42, 0.8);
  padding: 6px 10px;
  border-radius: 999px;
  color: var(--text);
  font-size: 0.85rem;
}

.remote-videos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
  align-content: start;
}

.remote-video-card {
  position: relative;
  min-height: 220px;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid var(--panel-border);
  background: rgba(15, 23, 42, 0.85);
}

.remote-video-card video {
  height: 220px;
}

.participants-panel {
  padding: 20px;
}

.participants-panel h3 {
  margin-bottom: 16px;
}

#participant-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 10px;
  color: var(--muted);
}

#participant-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 10px;
  padding: 10px 12px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--success);
  display: inline-block;
}

@media (max-width: 860px) {
  .video-grid {
    grid-template-columns: 1fr;
  }

  .topbar {
    flex-direction: column;
    align-items: flex-start;
  }
}
