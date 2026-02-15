const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const gaugeEl = document.getElementById("gauge");

const world = {
  hose: { x: 120, y: 420, angle: -0.62 },
  still: {
    x: 620,
    y: 80,
    width: 170,
    height: 340,
    inlet: { x: 700, y: 120, r: 14 },
    waterLevel: 0,
    targetLevel: 1,
  },
  key: { x: 0, y: 0, w: 28, h: 14 },
  droplets: [],
  aiming: false,
  won: false,
};

function resetGame() {
  world.still.waterLevel = 0;
  world.droplets = [];
  world.won = false;
  statusEl.textContent = "Attrape la clé !";
  updateGauge();
}

function updateGauge() {
  const pct = Math.floor(world.still.waterLevel * 100);
  gaugeEl.textContent = `Niveau d'eau : ${pct}%`;
}

function spawnDroplets(power) {
  const speed = 7 + power * 7;

  for (let i = 0; i < 5; i += 1) {
    const spread = (Math.random() - 0.5) * 0.14;
    const angle = world.hose.angle + spread;

    world.droplets.push({
      x: world.hose.x + Math.cos(world.hose.angle) * 30,
      y: world.hose.y + Math.sin(world.hose.angle) * 30,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      inside: false,
    });
  }
}

function moveDroplets() {
  const gravity = 0.17;
  const floorY = 485;
  const left = world.still.x;
  const right = world.still.x + world.still.width;
  const top = world.still.y;
  const bottom = world.still.y + world.still.height;

  world.droplets = world.droplets.filter((d) => {
    d.x += d.vx;
    d.y += d.vy;
    d.vy += gravity;
    d.life -= 0.01;

    const dx = d.x - world.still.inlet.x;
    const dy = d.y - world.still.inlet.y;
    const inInlet = Math.hypot(dx, dy) <= world.still.inlet.r;

    if (inInlet) {
      d.inside = true;
      d.vx *= 0.15;
      d.vy = Math.abs(d.vy) + 0.5;
    }

    if (d.inside && d.x > left && d.x < right && d.y > top && d.y < bottom) {
      world.still.waterLevel = Math.min(
        world.still.targetLevel,
        world.still.waterLevel + 0.0027,
      );
      updateGauge();
      return false;
    }

    return d.life > 0 && d.y < floorY;
  });
}

function updateKey() {
  const waterY =
    world.still.y + world.still.height - world.still.waterLevel * world.still.height;
  world.key.x = world.still.x + world.still.width / 2 - world.key.w / 2;
  world.key.y = Math.max(waterY - 22, world.still.y + 16);

  if (world.still.waterLevel >= 1 && !world.won) {
    world.won = true;
    statusEl.textContent = "Bravo ! La clé est remontée jusqu'en haut de l'alambic.";
  }
}

function drawRoom() {
  ctx.fillStyle = "#2d241e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#473a31";
  for (let i = 0; i < 10; i += 1) {
    ctx.fillRect(i * 100 - 40, 0, 60, canvas.height);
  }

  ctx.fillStyle = "#1b1715";
  ctx.fillRect(0, 480, canvas.width, 60);
}

function drawStill() {
  const { x, y, width, height, inlet, waterLevel } = world.still;

  ctx.save();
  ctx.strokeStyle = "#d9c47f";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 80);
  ctx.stroke();

  ctx.fillStyle = "rgba(95, 190, 255, 0.7)";
  const waterHeight = waterLevel * height;
  ctx.beginPath();
  ctx.roundRect(x + 5, y + height - waterHeight, width - 10, waterHeight, 70);
  ctx.fill();

  ctx.fillStyle = "#f8d177";
  ctx.beginPath();
  ctx.arc(inlet.x, inlet.y, inlet.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#c4a45f";
  ctx.fillRect(x + width / 2 - 6, y + height + 8, 12, 80);
  ctx.restore();
}

function drawKey() {
  ctx.save();
  ctx.fillStyle = "#f5dd7b";
  ctx.beginPath();
  ctx.arc(world.key.x + 8, world.key.y + 7, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillRect(world.key.x + 14, world.key.y + 4, world.key.w - 14, 6);
  ctx.fillRect(world.key.x + world.key.w - 8, world.key.y + 10, 4, 8);
  ctx.fillRect(world.key.x + world.key.w - 14, world.key.y + 10, 4, 8);
  ctx.restore();
}

function drawHose() {
  ctx.save();
  ctx.strokeStyle = "#202020";
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(18, 525);
  ctx.quadraticCurveTo(55, 470, world.hose.x, world.hose.y);
  ctx.stroke();

  ctx.translate(world.hose.x, world.hose.y);
  ctx.rotate(world.hose.angle);

  ctx.strokeStyle = "#101010";
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.lineTo(32, 0);
  ctx.stroke();

  ctx.fillStyle = world.aiming ? "#f97373" : "#999";
  ctx.fillRect(16, -8, 16, 16);

  ctx.restore();
}

function drawDroplets() {
  for (const d of world.droplets) {
    ctx.fillStyle = "rgba(116, 213, 255, 0.88)";
    ctx.beginPath();
    ctx.arc(d.x, d.y, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function frame() {
  drawRoom();

  if (world.aiming && !world.won) {
    spawnDroplets(1);
  }

  moveDroplets();
  updateKey();

  drawStill();
  drawKey();
  drawHose();
  drawDroplets();

  requestAnimationFrame(frame);
}

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const mx = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const my = ((event.clientY - rect.top) / rect.height) * canvas.height;

  const dx = mx - world.hose.x;
  const dy = my - world.hose.y;
  world.hose.angle = Math.max(-1.2, Math.min(-0.12, Math.atan2(dy, dx)));
});

canvas.addEventListener("mousedown", () => {
  if (!world.won) {
    world.aiming = true;
  }
});

window.addEventListener("mouseup", () => {
  world.aiming = false;
});

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r") {
    resetGame();
  }
});

resetGame();
frame();
