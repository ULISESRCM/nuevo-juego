(() => {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const scaleBase = 20; // base grid size in px
  let scale = scaleBase;
  let rows, cols;

  let snake = [];
  let fruit = null;
  let gameInterval = null;
  let speed = 120; // ms
  let paused = false;
  let scoreEl = document.getElementById('score');
  let bestEl = document.getElementById('best');

  function resizeCanvas() {
    // Make canvas square and responsive (max 480px)
    const max = Math.min(window.innerWidth - 48, 480);
    canvas.width = max;
    canvas.height = max;
    // Recalculate grid
    scale = Math.max(12, Math.round(canvas.width / 20));
    // keep scale multiples of 4 for nicer grid
    rows = Math.floor(canvas.height / scale);
    cols = Math.floor(canvas.width / scale);
  }

  function loadBest() {
    const b = parseInt(localStorage.getItem('snake_best_' + location.pathname), 10);
    return Number.isFinite(b) ? b : 0;
  }
  function saveBest(v) {
    localStorage.setItem('snake_best_' + location.pathname, String(v));
  }

  function init() {
    resizeCanvas();
    snake = [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2) }];
    snake.dx = 1; snake.dy = 0;
    placeFruit();
    paused = false;
    updateScore();
    bestEl.textContent = 'Mejor: ' + loadBest();
    draw();
  }

  function placeFruit() {
    // ensure fruit not on snake
    do {
      fruit = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
    } while (snake.some(s => s.x === fruit.x && s.y === fruit.y));
  }

  function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * scale, y * scale, scale, scale);
  }

  function update() {
    if (paused) return;
    const head = { x: (snake[0].x + snake.dx + cols) % cols, y: (snake[0].y + snake.dy + rows) % rows };
    // collision self
    if (snake.some((s, i) => i > 0 && s.x === head.x && s.y === head.y)) {
      onGameOver();
      return;
    }
    snake.unshift(head);
    // eat fruit
    if (head.x === fruit.x && head.y === fruit.y) {
      placeFruit();
      // increase speed slightly every 3 pieces
      if ((snake.length - 1) % 3 === 0 && speed > 50) {
        speed = Math.max(50, speed - 8);
        restartInterval();
      }
      updateScore();
    } else {
      snake.pop();
    }
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw grid (optional subtle)
    ctx.fillStyle = '#071126';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // fruit
    drawCell(fruit.x, fruit.y, '#ef4444');
    // snake
    for (let i = 0; i < snake.length; i++) {
      drawCell(snake[i].x, snake[i].y, i === 0 ? '#0ea5a4' : '#38bdf8');
    }
  }

  function updateScore() {
    const s = Math.max(0, snake.length - 1);
    scoreEl.textContent = 'Puntaje: ' + s;
    const best = loadBest();
    if (s > best) {
      saveBest(s);
      bestEl.textContent = 'Mejor: ' + s;
    }
  }

  function onGameOver() {
    clearInterval(gameInterval);
    gameInterval = null;
    const s = Math.max(0, snake.length - 1);
    const best = loadBest();
    if (s > best) saveBest(s);
    setTimeout(() => {
      alert('Game Over\nPuntaje: ' + s + '\nMejor: ' + loadBest());
    }, 10);
  }

  function restartInterval() {
    if (gameInterval) {
      clearInterval(gameInterval);
      gameInterval = setInterval(update, speed);
    }
  }

  function startGame() {
    if (gameInterval) clearInterval(gameInterval);
    paused = false;
    gameInterval = setInterval(update, speed);
  }

  function pauseToggle() {
    paused = !paused;
    document.getElementById('pause').textContent = paused ? 'Reanudar' : 'Pausa';
  }

  function restartGame() {
    if (gameInterval) { clearInterval(gameInterval); gameInterval = null; }
    speed = 120;
    init();
    startGame();
  }

  // keyboard controls
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (['arrowup', 'w'].includes(key) && snake.dy === 0) { snake.dx = 0; snake.dy = -1; }
    if (['arrowdown', 's'].includes(key) && snake.dy === 0) { snake.dx = 0; snake.dy = 1; }
    if (['arrowleft', 'a'].includes(key) && snake.dx === 0) { snake.dx = -1; snake.dy = 0; }
    if (['arrowright', 'd'].includes(key) && snake.dx === 0) { snake.dx = 1; snake.dy = 0; }
  });

  // touch controls
  document.querySelectorAll('#touch-controls .dir').forEach(btn => {
    btn.addEventListener('touchstart', e => {
      e.preventDefault();
      const dir = btn.dataset.dir;
      applyDir(dir);
    }, { passive: false });
    btn.addEventListener('mousedown', e => { e.preventDefault(); applyDir(btn.dataset.dir); });
  });

  function applyDir(dir) {
    if (dir === 'up' && snake.dy === 0) { snake.dx = 0; snake.dy = -1; }
    if (dir === 'down' && snake.dy === 0) { snake.dx = 0; snake.dy = 1; }
    if (dir === 'left' && snake.dx === 0) { snake.dx = -1; snake.dy = 0; }
    if (dir === 'right' && snake.dx === 0) { snake.dx = 1; snake.dy = 0; }
  }

  // control buttons
  document.getElementById('start').addEventListener('click', () => { startGame(); });
  document.getElementById('pause').addEventListener('click', () => { pauseToggle(); });
  document.getElementById('restart').addEventListener('click', () => { restartGame(); });

  // responsive handling
  window.addEventListener('resize', () => {
    const hadInterval = !!gameInterval;
    if (gameInterval) { clearInterval(gameInterval); gameInterval = null; }
    resizeCanvas();
    // clamp snake positions to new grid
    snake = snake.map(s => ({ x: Math.min(cols - 1, s.x), y: Math.min(rows - 1, s.y) }));
    placeFruit();
    draw();
    if (hadInterval) startGame();
  });

  // init and auto-start
  init();
  // small delay so layout stabilizes
  setTimeout(() => { startGame(); }, 300);

  // expose for debugging
  window._snakeGame = { restart: restartGame, pause: () => { paused = true; }, resume: () => { paused = false; }, getScore: () => Math.max(0, snake.length - 1) };
})();
