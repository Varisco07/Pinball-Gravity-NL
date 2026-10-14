const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

if (menuToggle && siteNav) {
	menuToggle.addEventListener("click", () => {
		const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
		menuToggle.setAttribute("aria-expanded", String(!isExpanded));
		menuToggle.setAttribute("aria-label", isExpanded ? "Apri il menu" : "Chiudi il menu");
		siteNav.classList.toggle("is-open", !isExpanded);
	});

	siteNav.addEventListener("click", (event) => {
		if (event.target.closest("a")) {
			menuToggle.setAttribute("aria-expanded", "false");
			menuToggle.setAttribute("aria-label", "Apri il menu");
			siteNav.classList.remove("is-open");
		}
	});
}

const canvas = document.getElementById("gameCanvas");

if (canvas) {
	const ctx = canvas.getContext("2d");
	const levelDisplay = document.getElementById("levelDisplay");
	const scoreDisplay = document.getElementById("scoreDisplay");
	const statusText = document.getElementById("statusText");
	const messageText = document.getElementById("messageText");
	const resetToStartButton = document.getElementById("resetToStartButton");

	const board = {
		width: canvas.width,
		height: canvas.height,
	};

	const LEVELS = [
		{
			target: { x: 512, y: 380, size: 22 },
			obstacles: [
				{ x: 110, y: 110, size: 24 },
				{ x: 240, y: 160, size: 28 },
				{ x: 400, y: 220, size: 30 },
				{ x: 180, y: 315, size: 24 },
				{ x: 320, y: 360, size: 28 },
				{ x: 480, y: 120, size: 20 }
			]
		},
		{
			target: { x: 120, y: 400, size: 22 },
			obstacles: [
				{ x: 90, y: 110, size: 22 },
				{ x: 220, y: 140, size: 26 },
				{ x: 370, y: 120, size: 32 },
				{ x: 260, y: 280, size: 28 },
				{ x: 440, y: 310, size: 24 },
				{ x: 540, y: 200, size: 28 }
			]
		},
		{
			target: { x: 508, y: 120, size: 22 },
			obstacles: [
				{ x: 70, y: 160, size: 24 },
				{ x: 180, y: 260, size: 30 },
				{ x: 315, y: 180, size: 26 },
				{ x: 445, y: 280, size: 26 },
				{ x: 225, y: 420, size: 28 },
				{ x: 520, y: 360, size: 20 }
			]
		}
	];

	const state = {
		level: 1,
		score: 0,
		lives: 3,
		message: "WAY TOO EASY",
		started: true,
		gameOver: false,
		dead: false,
		deathTimer: 0,
	};

	const keys = {
		KeyW: false,
		KeyA: false,
		KeyS: false,
		KeyD: false,
		ArrowUp: false,
		ArrowLeft: false,
		ArrowDown: false,
		ArrowRight: false,
	};

	const ball = {
		x: board.width * 0.5,
		y: 60,
		radius: 11,
		vx: 0,
		vy: 0,
	};

	let target = { x: 0, y: 0, size: 22 };
	let obstacles = [];

	function loadLevel(level) {
		const index = Math.min(Math.max(level, 1), LEVELS.length) - 1;
		const levelData = LEVELS[index];
		target = { ...levelData.target };
		obstacles = levelData.obstacles.map((block) => ({ ...block }));
	}

	function resetBallPosition() {
		ball.x = board.width * 0.5;
		ball.y = 60;
		ball.vx = 0;
		ball.vy = 0;
	}

	function updateHud() {
		levelDisplay.textContent = String(state.level);
		scoreDisplay.textContent = String(state.score);
		statusText.textContent = "LEVEL " + state.level;
		messageText.textContent = state.message;
	}

	function resetToStart() {
		state.level = 1;
		state.score = 0;
		state.lives = 3;
		state.message = "WAY TOO EASY";
		state.started = true;
		state.gameOver = false;
		state.dead = false;
		state.deathTimer = 0;
		loadLevel(state.level);
		resetBallPosition();
		updateHud();
	}

	function loseLife() {
		if (state.dead || state.gameOver) return;
		state.dead = true;
		state.deathTimer = 0.65;
		state.lives = Math.max(0, state.lives - 1);
		state.message = "CRASH";
		ball.vx = 0;
		ball.vy = 0;
		updateHud();
	}

	function nextLevel() {
		state.level += 1;
		if (state.level > LEVELS.length) {
			state.level = LEVELS.length;
			state.message = "LEVEL CLEAR";
			state.started = false;
			updateHud();
			return;
		}
		state.score += 150;
		state.message = "TARGET HIT";
		loadLevel(state.level);
		resetBallPosition();
		updateHud();
	}

	function rectCircleCollision(rect, circle) {
		const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.size));
		const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.size));
		const dx = circle.x - closestX;
		const dy = circle.y - closestY;
		return dx * dx + dy * dy < circle.radius * circle.radius;
	}

	function checkCollisions() {
		for (const rect of obstacles) {
			if (rectCircleCollision(rect, ball)) {
				loseLife();
				return;
			}
		}

		if (rectCircleCollision({ x: target.x, y: target.y, size: target.size }, ball)) {
			nextLevel();
		}
	}

	function updateBall() {
		if (!state.started || state.gameOver) return;

		if (state.dead) {
			state.deathTimer -= 1 / 60;
			if (state.deathTimer <= 0) {
				state.started = false;
				if (state.lives <= 0) {
					state.gameOver = true;
					state.message = "GAME OVER";
				} else {
					state.message = "CRASH";
				}
				updateHud();
			}
			return;
		}

		ball.vy += 0.05;
		if (keys.KeyA || keys.ArrowLeft) ball.vx -= 0.08;
		if (keys.KeyD || keys.ArrowRight) ball.vx += 0.08;
		if (keys.KeyW || keys.ArrowUp) ball.vy -= 0.10;
		if (keys.KeyS || keys.ArrowDown) ball.vy += 0.10;

		ball.vx *= 0.985;
		ball.vy *= 0.995;

		const maxSpeed = 3.2;
		const speed = Math.hypot(ball.vx, ball.vy);
		if (speed > maxSpeed) {
			ball.vx = (ball.vx / speed) * maxSpeed;
			ball.vy = (ball.vy / speed) * maxSpeed;
		}

		ball.x += ball.vx;
		ball.y += ball.vy;

		if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= board.width || ball.y - ball.radius <= 0 || ball.y + ball.radius >= board.height) {
			loseLife();
			return;
		}

		checkCollisions();
	}

	function drawBackground() {
		ctx.fillStyle = "#000000";
		ctx.fillRect(0, 0, board.width, board.height);

		ctx.strokeStyle = "rgba(30, 110, 255, 0.7)";
		ctx.lineWidth = 2;
		for (let x = 0; x <= board.width; x += 40) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, board.height);
			ctx.stroke();
		}
		for (let y = 0; y <= board.height; y += 40) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(board.width, y);
			ctx.stroke();
		}
	}

	function drawTarget() {
		const pulse = 1 + Math.sin(Date.now() / 170) * 0.18;
		const glowSize = target.size * pulse;
		ctx.save();
		ctx.shadowColor = "rgba(125, 255, 154, 0.95)";
		ctx.shadowBlur = 18;
		ctx.fillStyle = "#6dff9c";
		ctx.fillRect(target.x - (glowSize - target.size) / 2, target.y - (glowSize - target.size) / 2, glowSize, glowSize);
		ctx.restore();
		ctx.strokeStyle = "rgba(255,255,255,0.38)";
		ctx.strokeRect(target.x, target.y, target.size, target.size);
	}

	function drawObstacles() {
		for (const rect of obstacles) {
			ctx.fillStyle = "#ff4d4d";
			ctx.fillRect(rect.x, rect.y, rect.size, rect.size);
			ctx.strokeStyle = "rgba(255,255,255,0.2)";
			ctx.strokeRect(rect.x, rect.y, rect.size, rect.size);
		}
	}

	function drawBall() {
		ctx.beginPath();
		ctx.fillStyle = "#f0f0f0";
		ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
		ctx.fill();
	}

	function drawDeathFlash() {
		if (!state.dead) return;
		ctx.fillStyle = `rgba(255, 63, 63, ${0.22 + (0.7 - state.deathTimer)})`;
		ctx.fillRect(0, 0, board.width, board.height);
	}

	function draw() {
		drawBackground();
		drawTarget();
		drawObstacles();
		drawBall();
		drawDeathFlash();
	}

	function gameLoop() {
		updateBall();
		draw();
		requestAnimationFrame(gameLoop);
	}

	window.addEventListener("keydown", (event) => {
		if (event.code in keys) {
			event.preventDefault();
			keys[event.code] = true;
		}
	});

	window.addEventListener("keyup", (event) => {
		if (event.code in keys) {
			keys[event.code] = false;
		}
	});

	resetToStartButton.addEventListener("click", () => {
		resetToStart();
	});

	loadLevel(state.level);
	resetBallPosition();
	updateHud();
	requestAnimationFrame(gameLoop);
}
