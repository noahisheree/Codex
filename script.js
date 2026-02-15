const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const waterPercentEl = document.getElementById("waterPercent");
const timerEl = document.getElementById("timer");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");

const state = {
  player: { x: 170, y: 410 },
  hoseAnchor: { x: 190, y: 385 },
  nozzle: { x: 250, y: 390 },
  maxHoseLength: 185,
  aiming: false,
  waterLevel: 0,
  keyLift: 0,
  win: false,
  time: 0,
};

const alembic = {
  x: 650,
  y: 130,
  w: 180,
  h: 340,
  inlet: { x: 610, y: 155, r: 16 },
};

const droplets = [];
let lastTime = 0;

function clampNozzle() {
  const dx = state.nozzle.x - state.hoseAnchor.x;
  const dy = state.nozzle.y - state.hoseAnchor.y;
  const dist = Math.hypot(dx, dy);
  if (dist > state.maxHoseLength) {
    const s = state.maxHoseLength / dist;
    state.nozzle.x = state.hoseAnchor.x + dx * s;
    state.nozzle.y = state.hoseAnchor.y + dy * s;
  }
}

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  state.nozzle.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  state.nozzle.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  clampNozzle();
});

canvas.addEventListener("mousedown", () => {
  state.aiming = true;
});
window.addEventListener("mouseup", () => {
  state.aiming = false;
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    state.aiming = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "Space") {
    state.aiming = false;
  }
});

restartBtn.addEventListener("click", resetGame);

function resetGame() {
  state.waterLevel = 0;
  state.keyLift = 0;
  state.win = false;
  state.time = 0;
  droplets.length = 0;
  statusEl.classList.remove("win");
  statusEl.textContent = "Remplis l'alambic pour faire remonter la clé.";
}

function emitWater() {
  const angle = Math.atan2(alembic.inlet.y - state.nozzle.y, alembic.inlet.x - state.nozzle.x);
  for (let i = 0; i < 6; i += 1) {
    const spread = (Math.random() - 0.5) * 0.26;
    const speed = 460 + Math.random() * 130;
    droplets.push({
      x: state.nozzle.x,
      y: state.nozzle.y,
      vx: Math.cos(angle + spread) * speed,
      vy: Math.sin(angle + spread) * speed,
      life: 0.75 + Math.random() * 0.35,
      hit: false,
    });
  }
}

function update(dt) {
  if (!state.win) {
    state.time += dt;
  }

  if (state.aiming && !state.win) {
    emitWater();
  }

  const inletHitRadius = alembic.inlet.r + 8;
  let inletHits = 0;

  for (let i = droplets.length - 1; i >= 0; i -= 1) {
    const d = droplets[i];
    d.life -= dt;
    d.vy += 600 * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;

    const distInlet = Math.hypot(d.x - alembic.inlet.x, d.y - alembic.inlet.y);
    if (!d.hit && distInlet < inletHitRadius) {
      d.hit = true;
      inletHits += 1;
      droplets.splice(i, 1);
      continue;
    }

    if (d.life <= 0 || d.y > canvas.height + 30 || d.x > canvas.width + 30 || d.x < -30) {
      droplets.splice(i, 1);
    }
  }

  if (!state.win) {
    state.waterLevel += inletHits * 0.0045;
    state.waterLevel -= dt * 0.008;
    state.waterLevel = Math.min(1, Math.max(0, state.waterLevel));
    state.keyLift = state.waterLevel;

    if (state.waterLevel >= 1) {
      state.win = true;
      statusEl.classList.add("win");
      statusEl.textContent = `Bravo ! La clé est sortie en ${state.time.toFixed(1)}s.`;
    }
  }

  waterPercentEl.textContent = Math.round(state.waterLevel * 100);
  timerEl.textContent = state.time.toFixed(1);
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#453322";
  ctx.fillRect(0, 445, canvas.width, 115);

  ctx.fillStyle = "#2f2318";
  for (let i = 0; i < 7; i += 1) {
    ctx.fillRect(30 + i * 130, 60 + (i % 2) * 25, 70, 18);
  }

  ctx.strokeStyle = "#2a1e13";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(state.hoseAnchor.x, state.hoseAnchor.y);
  const mx = (state.hoseAnchor.x + state.nozzle.x) / 2;
  const my = Math.max(state.hoseAnchor.y, state.nozzle.y) + 28;
  ctx.quadraticCurveTo(mx, my, state.nozzle.x, state.nozzle.y);
  ctx.stroke();

  ctx.fillStyle = "#f2bca5";
  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y - 70, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#9c2525";
  ctx.fillRect(state.player.x - 12, state.player.y - 52, 24, 55);

  ctx.fillStyle = "#e1d7c6";
  ctx.beginPath();
  ctx.arc(state.nozzle.x, state.nozzle.y, 7, 0, Math.PI * 2);
  ctx.fill();

  drawAlembic();

  ctx.fillStyle = "#6ed0ff";
  for (const d of droplets) {
    ctx.beginPath();
    ctx.arc(d.x, d.y, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAlembic() {
  const radius = alembic.w / 2;
  const cx = alembic.x + radius;
  const cy = alembic.y + radius;

  ctx.strokeStyle = "#c28d3e";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(alembic.x + 54, alembic.y + alembic.h - 20);
  ctx.lineTo(alembic.x + 36, alembic.y + alembic.h + 56);
  ctx.moveTo(alembic.x + alembic.w - 54, alembic.y + alembic.h - 20);
  ctx.lineTo(alembic.x + alembic.w - 36, alembic.y + alembic.h + 56);
  ctx.stroke();

  const liquidHeight = radius * 2 * state.waterLevel;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "rgba(70, 176, 245, 0.7)";
  ctx.fillRect(alembic.x, alembic.y + alembic.w - liquidHeight, alembic.w, liquidHeight);
  ctx.restore();

  ctx.fillStyle = "#201305";
  const keyY = alembic.y + alembic.w - 28 - state.keyLift * (alembic.w - 72);
  ctx.fillRect(cx - 5, keyY, 10, 35);
  ctx.beginPath();
  ctx.arc(cx, keyY - 6, 11, 0, Math.PI * 2);
  ctx.strokeStyle = "#201305";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#7a5b2b";
  ctx.beginPath();
  ctx.arc(alembic.inlet.x, alembic.inlet.y, alembic.inlet.r + 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#22180f";
  ctx.beginPath();
  ctx.arc(alembic.inlet.x, alembic.inlet.y, alembic.inlet.r, 0, Math.PI * 2);
  ctx.fill();
}

function loop(timestamp) {
  const delta = Math.min((timestamp - lastTime) / 1000 || 0, 0.032);
  lastTime = timestamp;
  update(delta);
  drawScene();
  requestAnimationFrame(loop);
}

resetGame();
requestAnimationFrame(loop);
