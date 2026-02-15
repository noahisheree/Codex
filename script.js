const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const waterBar = document.getElementById("waterBar");
const waterPercent = document.getElementById("waterPercent");
const statusText = document.getElementById("status");
const resetBtn = document.getElementById("resetBtn");

const game = {
  mouseX: canvas.width * 0.2,
  mouseY: canvas.height * 0.45,
  pinching: false,
  particles: [],
  waterLevel: 0,
  won: false,
  lastTime: 0,
};

const world = {
  hoseOrigin: { x: 120, y: 430 },
  nozzleLength: 38,
  bottleX: 610,
  bottleY: 120,
  bottleW: 180,
  bottleH: 340,
  neckX: 675,
  neckY: 84,
  neckW: 50,
  neckH: 36,
  keyBaseY: 402,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updateAimFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  game.mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
  game.mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
}

canvas.addEventListener("mousemove", updateAimFromEvent);
canvas.addEventListener("mousedown", () => (game.pinching = true));
window.addEventListener("mouseup", () => (game.pinching = false));
window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    game.pinching = true;
  }
});
window.addEventListener("keyup", (event) => {
  if (event.code === "Space") {
    game.pinching = false;
  }
});

resetBtn.addEventListener("click", () => {
  game.particles = [];
  game.waterLevel = 0;
  game.won = false;
  statusText.textContent = "Orientez le jet vers l'orifice et maintenez pour remplir l'alambic.";
});

function createParticles(dt) {
  if (!game.pinching || game.won) {
    return;
  }

  const dx = game.mouseX - world.hoseOrigin.x;
  const dy = game.mouseY - world.hoseOrigin.y;
  const angle = Math.atan2(dy, dx);

  const pressure = 480;
  const spawnCount = Math.max(1, Math.floor(dt * 0.09));

  for (let i = 0; i < spawnCount; i += 1) {
    const jitter = (Math.random() - 0.5) * 0.12;
    const speed = pressure + Math.random() * 80;
    game.particles.push({
      x: world.hoseOrigin.x + Math.cos(angle) * world.nozzleLength,
      y: world.hoseOrigin.y + Math.sin(angle) * world.nozzleLength,
      vx: Math.cos(angle + jitter) * speed,
      vy: Math.sin(angle + jitter) * speed,
      life: 0,
      maxLife: 1.2,
    });
  }
}

function pointInNeck(x, y) {
  return (
    x >= world.neckX &&
    x <= world.neckX + world.neckW &&
    y >= world.neckY &&
    y <= world.neckY + world.neckH
  );
}

function updateParticles(dt) {
  const gravity = 460;
  let waterGain = 0;

  game.particles = game.particles.filter((p) => {
    p.vy += gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life += dt;

    if (pointInNeck(p.x, p.y)) {
      waterGain += 0.35;
      return false;
    }

    const offscreen = p.x < 0 || p.x > canvas.width || p.y > canvas.height || p.y < 0;
    return p.life < p.maxLife && !offscreen;
  });

  game.waterLevel = clamp(game.waterLevel + waterGain, 0, 100);

  if (game.waterLevel >= 100 && !game.won) {
    game.won = true;
    statusText.textContent = "Bravo ! La clé est remontée. L'épreuve est réussie.";
  }

  waterBar.style.width = `${game.waterLevel}%`;
  waterPercent.textContent = Math.floor(game.waterLevel);
}

function drawCellBackground() {
  const wall = ctx.createLinearGradient(0, 0, 0, canvas.height);
  wall.addColorStop(0, "#2f241d");
  wall.addColorStop(1, "#15100d");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 210, 130, 0.08)";
  ctx.beginPath();
  ctx.arc(680, 85, 92, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1a1411";
  ctx.fillRect(0, 450, canvas.width, 110);
}

function drawAlembic() {
  const waterHeight = (world.bottleH - 24) * (game.waterLevel / 100);

  ctx.strokeStyle = "#c8a069";
  ctx.lineWidth = 7;
  ctx.strokeRect(world.bottleX, world.bottleY, world.bottleW, world.bottleH);

  ctx.fillStyle = "rgba(56, 163, 255, 0.5)";
  ctx.fillRect(
    world.bottleX + 4,
    world.bottleY + world.bottleH - waterHeight - 4,
    world.bottleW - 8,
    waterHeight
  );

  ctx.fillStyle = "#d8b57a";
  ctx.fillRect(world.neckX, world.neckY, world.neckW, world.neckH);

  ctx.strokeStyle = "#b88f56";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(700, 78, 64, 0, Math.PI * 2);
  ctx.stroke();

  const keyY = world.keyBaseY - (game.waterLevel / 100) * 230;
  ctx.strokeStyle = "#f2d075";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(700, keyY);
  ctx.lineTo(700, keyY + 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(700, keyY - 10, 14, 0, Math.PI * 2);
  ctx.stroke();
}

function drawCandidateAndHose() {
  ctx.fillStyle = "#917d66";
  ctx.fillRect(72, 288, 38, 120);
  ctx.fillStyle = "#ddb99c";
  ctx.beginPath();
  ctx.arc(92, 268, 18, 0, Math.PI * 2);
  ctx.fill();

  const dx = game.mouseX - world.hoseOrigin.x;
  const dy = game.mouseY - world.hoseOrigin.y;
  const angle = Math.atan2(dy, dx);
  const nozzleX = world.hoseOrigin.x + Math.cos(angle) * world.nozzleLength;
  const nozzleY = world.hoseOrigin.y + Math.sin(angle) * world.nozzleLength;

  ctx.strokeStyle = game.pinching ? "#9fe3ff" : "#637d8f";
  ctx.lineWidth = 11;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(34, 518);
  ctx.bezierCurveTo(68, 430, 80, 428, world.hoseOrigin.x, world.hoseOrigin.y);
  ctx.lineTo(nozzleX, nozzleY);
  ctx.stroke();

  if (game.pinching) {
    ctx.fillStyle = "#7ed7ff";
    ctx.beginPath();
    ctx.arc(nozzleX, nozzleY, 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParticles() {
  ctx.fillStyle = "rgba(135, 216, 255, 0.9)";
  game.particles.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2);
    ctx.fill();
  });
}

function render() {
  drawCellBackground();
  drawAlembic();
  drawCandidateAndHose();
  drawParticles();
}

function frame(timestamp) {
  if (!game.lastTime) {
    game.lastTime = timestamp;
  }

  const dt = clamp((timestamp - game.lastTime) / 1000, 0, 0.05);
  game.lastTime = timestamp;

  createParticles(dt * 1000);
  updateParticles(dt);
  render();

  if (!game.won && game.waterLevel > 0) {
    statusText.textContent = "Continuez ! Visez précisément l'orifice supérieur.";
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
