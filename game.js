const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const scoreElement = document.querySelector('#score');
const bestElement = document.querySelector('#best');
const message = document.querySelector('#message');
const startButton = document.querySelector('#startButton');

const keys = new Set();
const player = { x: 400, y: 440, width: 34, height: 24, speed: 7 };
let meteors = [], stars = [], score = 0, running = false, lastTime = 0, spawnTimer = 0;
let best = Number(localStorage.getItem('starDodgerBest') || 0);
bestElement.textContent = best;

for (let i = 0; i < 90; i++) stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 2 + .5, speed: Math.random() * 25 + 10 });

function reset() {
  player.x = canvas.width / 2;
  meteors = [];
  score = 0;
  spawnTimer = 0;
  scoreElement.textContent = score;
}

function start() {
  reset();
  running = true;
  message.classList.add('hidden');
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function end() {
  running = false;
  if (score > best) {
    best = score;
    localStorage.setItem('starDodgerBest', best);
    bestElement.textContent = best;
  }
  message.querySelector('h2').textContent = 'Game over!';
  message.querySelector('p').textContent = `You scored ${score} points. Can you beat your best?`;
  startButton.textContent = 'Play again';
  message.classList.remove('hidden');
}

function spawnMeteor() {
  const size = 18 + Math.random() * 25;
  meteors.push({ x: size + Math.random() * (canvas.width - size * 2), y: -size, size, speed: 150 + Math.random() * 100 + score * 2, spin: Math.random() * 6.28 });
}

function update(dt) {
  const direction = keys.has('ArrowLeft') || keys.has('a') ? -1 : keys.has('ArrowRight') || keys.has('d') ? 1 : 0;
  player.x += direction * player.speed * 60 * dt;
  player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
  spawnTimer -= dt;
  if (spawnTimer <= 0) { spawnMeteor(); spawnTimer = Math.max(.25, .8 - score / 300); }
  stars.forEach(star => { star.y += star.speed * dt; if (star.y > canvas.height) star.y = 0; });
  meteors.forEach(meteor => { meteor.y += meteor.speed * dt; meteor.spin += dt * 2; });
  meteors = meteors.filter(meteor => meteor.y < canvas.height + meteor.size);
  score += Math.floor(dt * 10);
  scoreElement.textContent = score;
  for (const meteor of meteors) {
    const hitX = Math.abs(meteor.x - player.x) < meteor.size / 2 + player.width / 2;
    const hitY = Math.abs(meteor.y - player.y) < meteor.size / 2 + player.height / 2;
    if (hitX && hitY) return end();
  }
}

function draw() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#101943'); gradient.addColorStop(1, '#17102e');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
  stars.forEach(star => { ctx.fillStyle = `rgba(255,255,255,${.3 + star.size / 3})`; ctx.fillRect(star.x, star.y, star.size, star.size); });
  meteors.forEach(meteor => {
    ctx.save(); ctx.translate(meteor.x, meteor.y); ctx.rotate(meteor.spin);
    ctx.fillStyle = '#ff6f91'; ctx.shadowColor = '#ff416c'; ctx.shadowBlur = 18;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const r = meteor.size / 2 * (i % 2 ? .75 : 1); const a = i * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  });
  ctx.save(); ctx.translate(player.x, player.y); ctx.shadowColor = '#83f7d1'; ctx.shadowBlur = 22;
  ctx.fillStyle = '#83f7d1'; ctx.beginPath(); ctx.moveTo(0, -player.height / 2); ctx.lineTo(player.width / 2, player.height / 2); ctx.lineTo(0, player.height / 4); ctx.lineTo(-player.width / 2, player.height / 2); ctx.closePath(); ctx.fill(); ctx.restore();
}

function loop(time) {
  if (!running) return;
  const dt = Math.min((time - lastTime) / 1000, .05); lastTime = time;
  update(dt); draw();
  if (running) requestAnimationFrame(loop);
}

window.addEventListener('keydown', event => { if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(event.key)) { event.preventDefault(); keys.add(event.key); } if (event.key === ' ' && !running) start(); });
window.addEventListener('keyup', event => keys.delete(event.key));
startButton.addEventListener('click', start);
document.querySelectorAll('[data-key]').forEach(button => {
  const key = button.dataset.key;
  button.addEventListener('pointerdown', () => keys.add(key));
  button.addEventListener('pointerup', () => keys.delete(key));
  button.addEventListener('pointerleave', () => keys.delete(key));
});
draw();
