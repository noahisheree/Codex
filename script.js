const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const pressureLabel = document.getElementById("pressureLabel");
const fillLabel = document.getElementById("fillLabel");
const resetBtn = document.getElementById("resetBtn");

const hoseBase = { x: 130, y: 410 };
const inlet = { x: 660, y: 165, r: 18 };
const flask = { x: 640, y: 255, w: 220, h: 250 };
const key = { x: flask.x + flask.w / 2, y: flask.y + flask.h - 36, r: 15 };

let mouse = { x: inlet.x, y: inlet.y };
let isPinching = false;
let pressure = 0;
let fill = 0;
let won = false;

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  mouse.x = (event.clientX - rect.left) * scaleX;
  mouse.y = (event.clientY - rect.top) * scaleY;
});

canvas.addEventListener("mousedown", () => {
  isPinching = true;
});

window.addEventListener("mouseup", () => {
  isPinching = false;
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    isPinching = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "Space") {
    isPinching = false;
  }
});

resetBtn.addEventListener("click", () => {
  pressure = 0;
  fill = 0;
  won = false;
  key.y = flask.y + flask.h - 36;
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  drawPipeAndPlayer();
  drawFlask();
  drawWaterJet();
  drawKey();
  drawOverlay();
}

function drawBackground() {
  ctx.fillStyle = "#241a14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#3a2c22";
  for (let i = 0; i < 8; i += 1) {
    ctx.fillRect(i * 120, 0, 3, canvas.height);
  }

  ctx.fillStyle = "#4e3f32";
  ctx.fillRect(0, 420, canvas.width, 120);
}

function drawPipeAndPlayer() {
  ctx.strokeStyle = "#7c8b8f";
  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(35, 500);
  ctx.quadraticCurveTo(70, 430, hoseBase.x, hoseBase.y);
  ctx.stroke();

  ctx.fillStyle = "#8ac7ff";
  ctx.beginPath();
  ctx.arc(hoseBase.x, hoseBase.y, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#b69a77";
  ctx.fillRect(50, 320, 26, 70);
  ctx.fillStyle = "#e5d0ac";
  ctx.beginPath();
  ctx.arc(63, 304, 16, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlask() {
  ctx.strokeStyle = "#d2ba95";
  ctx.lineWidth = 8;
  ctx.strokeRect(flask.x, flask.y, flask.w, flask.h);

  ctx.beginPath();
  ctx.moveTo(flask.x + 92, flask.y);
  ctx.lineTo(flask.x + 92, 92);
  ctx.lineTo(flask.x + 128, 92);
  ctx.lineTo(flask.x + 128, flask.y);
  ctx.stroke();

  ctx.fillStyle = "#271f17";
  ctx.beginPath();
  ctx.arc(inlet.x, inlet.y, inlet.r, 0, Math.PI * 2);
  ctx.fill();

  const waterHeight = flask.h * fill;
  ctx.fillStyle = "rgba(90, 176, 255, 0.65)";
  ctx.fillRect(flask.x + 4, flask.y + flask.h - waterHeight + 4, flask.w - 8, waterHeight - 8);
}

function drawWaterJet() {
  if (pressure <= 0.02) {
    return;
  }

  const dx = mouse.x - hoseBase.x;
  const dy = mouse.y - hoseBase.y;
  const distance = Math.hypot(dx, dy) || 1;
  const nx = dx / distance;
  const ny = dy / distance;

  const reach = 220 + pressure * 500;
  const endX = hoseBase.x + nx * reach;
  const endY = hoseBase.y + ny * reach;

  ctx.strokeStyle = "rgba(127, 208, 255, 0.95)";
  ctx.lineWidth = 4 + pressure * 5;
  ctx.beginPath();
  ctx.moveTo(hoseBase.x, hoseBase.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  const hit = Math.hypot(endX - inlet.x, endY - inlet.y) < inlet.r + 16;
  if (hit && !won) {
    fill = clamp(fill + 0.004 + pressure * 0.006, 0, 1);
  } else {
    fill = clamp(fill - 0.0018, 0, 1);
  }

  if (fill >= 0.92 && !won) {
    won = true;
  }
}

function drawKey() {
  const minY = flask.y + 35;
  const maxY = flask.y + flask.h - 36;
  key.y = maxY - (maxY - minY) * fill;

  ctx.strokeStyle = "#ffd95f";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(key.x, key.y, key.r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(key.x + key.r, key.y + 2);
  ctx.lineTo(key.x + key.r + 24, key.y + 2);
  ctx.lineTo(key.x + key.r + 24, key.y + 10);
  ctx.moveTo(key.x + key.r + 12, key.y + 2);
  ctx.lineTo(key.x + key.r + 12, key.y + 12);
  ctx.stroke();
}

function drawOverlay() {
  ctx.fillStyle = "#f6ecd9";
  ctx.font = "700 20px Trebuchet MS";
  ctx.fillText("Orifice d'entrée", inlet.x - 78, inlet.y - 30);

  if (won) {
    ctx.fillStyle = "rgba(12, 40, 24, 0.82)";
    ctx.fillRect(210, 200, 480, 120);
    ctx.strokeStyle = "#7effad";
    ctx.lineWidth = 3;
    ctx.strokeRect(210, 200, 480, 120);

    ctx.fillStyle = "#d8ffe8";
    ctx.font = "700 38px Trebuchet MS";
    ctx.fillText("Clé récupérée !", 320, 270);
  }
}

function update() {
  pressure = clamp(pressure + (isPinching ? 0.025 : -0.035), 0, 1);

  if (pressure <= 0.01) {
    fill = clamp(fill - 0.0018, 0, 1);
  }

  pressureLabel.textContent = `Pression : ${Math.round(pressure * 100)}%`;
  fillLabel.textContent = `Niveau d'eau : ${Math.round(fill * 100)}%`;

  drawScene();
  requestAnimationFrame(update);
}

update();
