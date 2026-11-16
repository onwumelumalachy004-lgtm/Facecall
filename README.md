* {
  box-sizing: border-box;
}

:root {
  --bg: #07111f;
  --bg-2: #0f1d32;
  --panel: rgba(15, 23, 42, 0.9);
  --panel-border: rgba(148, 163, 184, 0.2);
  --text: #edf6ff;
  --muted: #a7bedf;
  --primary: #61dafb;
  --primary-2: #7c6cff;
  --success: #34d399;
  --danger: #f87171;
}

html, body {
  margin: 0;
  min-height: 100%;
  font-family: Inter, 'Segoe UI', sans-serif;
  background: radial-gradient(circle at top, #10213d 0%, #08111d 50%, #050b13 100%);
  color: var(--text);
}

button,
input {
  font: inherit;
}

.app-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 18px 48px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

h1, h2, h3, p {
  margin: 0;
}

h1 {
  font-size: clamp(2.1rem, 5vw, 3.4rem);
}

.panel {
  display: block;
}

.hidden {
  display: none !important;
}

.card,
.status-bar,
.video-card,
.participants-panel {
  background: rgba(15, 23, 42, 0.86);
  border: 1px solid var(--panel-border);
  border-radius: 18px;
  box-shadow: 0 20px 40px rgba(2, 6, 23, 0.45);
}

.card {
  width: min(540px, 100%);
  margin: 0 auto;
  padding: 28px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 8px;
  border-radius: 999px;
  background: rgba(97, 218, 251, 0.12);
  color: var(--primary);
  border: 1px solid rgba(97, 218, 251, 0.3);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
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
  width: 100%;
  background: rgba(15, 23, 42, 0.9);
  color: var(--text);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  padding: 12px 14px;
  outline: none;
}

input:focus {
  border-color: rgba(97, 218, 251, 0.7);
  box-shadow: 0 0 0 3px rgba(97, 218, 251, 0.15);
}

button {
  border: none;
  border-radius: 12px;
  cursor: pointer;
  background: linear-gradient(135deg, var(--primary), var(--primary-2));
  color: #07111f;
  font-weight: 800;
  padding: 12px 18px;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

button:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 28px rgba(97, 218, 251, 0.25);
}

.secondary-btn {
  background: rgba(15, 23, 42, 0.75);
  color: var(--text);
  border: 1px solid var(--panel-border);
}

.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  color: var(--muted);
  margin-bottom: 20px;
}

.video-grid {
  display: grid;
  grid-template-columns: minmax(300px, 1.2fr) minmax(260px, 1fr);
  gap: 20px;
}

.video-card {
  position: relative;
  min-height: 360px;
  overflow: hidden;
}

video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
}

.local-card {
  border-color: rgba(97, 218, 251, 0.45);
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
  background: rgba(15, 23, 42, 0.8);
}

.label {
  position: absolute;
  left: 12px;
  bottom: 12px;
  background: rgba(5, 11, 19, 0.8);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.8rem;
  color: var(--text);
}

.participants-panel {
  padding: 18px 20px;
  margin-top: 20px;
}

.participants-panel h3 {
  margin-bottom: 12px;
}

#participant-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 10px;
}

#participant-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.12);
  color: var(--muted);
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
