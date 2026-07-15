// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const startBtn = document.getElementById('start-btn');

// Grid settings
const gridSize = 20;
const tileCount = canvas.width / gridSize;

// Game state
let snake = [];
let food = {};
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop = null;
let gameSpeed = 100;
let isGameRunning = false;
let particles = [];

// Initialize
highScoreElement.textContent = highScore;

// Start button
startBtn.addEventListener('click', startGame);

// Keyboard controls
document.addEventListener('keydown', handleKeyDown);

// Mobile controls
document.getElementById('up').addEventListener('click', () => setDirection(0, -1));
document.getElementById('down').addEventListener('click', () => setDirection(0, 1));
document.getElementById('left').addEventListener('click', () => setDirection(-1, 0));
document.getElementById('right').addEventListener('click', () => setDirection(1, 0));

function handleKeyDown(e) {
    if (!isGameRunning && (e.key === ' ' || e.key === 'Enter')) {
        startGame();
        return;
    }
    
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            setDirection(0, -1);
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            setDirection(0, 1);
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            setDirection(-1, 0);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            setDirection(1, 0);
            break;
    }
}

function setDirection(x, y) {
    // Prevent reversing direction
    if (direction.x !== -x || direction.y !== -y) {
        nextDirection = { x, y };
    }
}

function startGame() {
    if (isGameRunning) return;
    
    // Reset game state
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    gameSpeed = 100;
    particles = [];
    scoreElement.textContent = score;
    
    spawnFood();
    
    isGameRunning = true;
    startBtn.textContent = 'Game Running...';
    startBtn.disabled = true;
    
    // Clear and start game loop
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(gameStep, gameSpeed);
    
    // Start render loop
    requestAnimationFrame(render);
}

function gameStep() {
    direction = nextDirection;
    
    // Calculate new head position
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;
    
    // Check wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }
    
    // Check self collision
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }
    
    // Add new head
    snake.unshift(head);
    
    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        // Eat food
        score += 10;
        scoreElement.textContent = score;
        
        // Update high score
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        
        // Create particles
        createFoodParticles(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2);
        
        // Increase speed slightly
        if (gameSpeed > 50) {
            gameSpeed -= 1;
            clearInterval(gameLoop);
            gameLoop = setInterval(gameStep, gameSpeed);
        }
        
        spawnFood();
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }
}

function spawnFood() {
    do {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (isSnakeAt(food.x, food.y));
}

function isSnakeAt(x, y) {
    return snake.some(segment => segment.x === x && segment.y === y);
}

function gameOver() {
    isGameRunning = false;
    clearInterval(gameLoop);
    startBtn.textContent = 'Play Again';
    startBtn.disabled = false;
    
    // Draw game over screen
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.fillStyle = '#f1c40f';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    
    ctx.fillStyle = '#4ecca3';
    ctx.font = '16px Arial';
    ctx.fillText('Click "Play Again" to restart', canvas.width / 2, canvas.height / 2 + 55);
}

function createFoodParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1,
            color: '#e74c3c'
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function render() {
    if (!isGameRunning && particles.length === 0) return;
    
    // Clear canvas
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid (subtle)
    ctx.strokeStyle = 'rgba(78, 204, 163, 0.1)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
    
    // Draw food with glow
    ctx.shadowColor = '#e74c3c';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    const foodX = food.x * gridSize + gridSize / 2;
    const foodY = food.y * gridSize + gridSize / 2;
    ctx.arc(foodX, foodY, gridSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw snake
    snake.forEach((segment, index) => {
        // Head is brighter
        if (index === 0) {
            ctx.fillStyle = '#4ecca3';
            ctx.shadowColor = '#4ecca3';
            ctx.shadowBlur = 8;
        } else {
            // Gradient from head to tail
            const ratio = index / snake.length;
            const r = Math.floor(78 * (1 - ratio * 0.5));
            const g = Math.floor(204 * (1 - ratio * 0.5));
            const b = Math.floor(163 * (1 - ratio * 0.5));
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.shadowBlur = 0;
        }
        
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        
        // Rounded rectangle for each segment
        roundRect(ctx, x + 1, y + 1, gridSize - 2, gridSize - 2, 5);
        ctx.fill();
        
        // Draw eyes on head
        if (index === 0) {
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 0;
            const eyeSize = 3;
            const eyeOffset = 5;
            
            // Position eyes based on direction
            let eye1X, eye1Y, eye2X, eye2Y;
            const centerX = x + gridSize / 2;
            const centerY = y + gridSize / 2;
            
            if (direction.x === 1) { // Right
                eye1X = centerX + 2; eye1Y = centerY - eyeOffset;
                eye2X = centerX + 2; eye2Y = centerY + eyeOffset;
            } else if (direction.x === -1) { // Left
                eye1X = centerX - 2; eye1Y = centerY - eyeOffset;
                eye2X = centerX - 2; eye2Y = centerY + eyeOffset;
            } else if (direction.y === -1) { // Up
                eye1X = centerX - eyeOffset; eye1Y = centerY - 2;
                eye2X = centerX + eyeOffset; eye2Y = centerY - 2;
            } else { // Down
                eye1X = centerX - eyeOffset; eye1Y = centerY + 2;
                eye2X = centerX + eyeOffset; eye2Y = centerY + 2;
            }
            
            ctx.beginPath();
            ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    ctx.shadowBlur = 0;
    
    // Update and draw particles
    updateParticles();
    drawParticles();
    
    requestAnimationFrame(render);
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Draw initial screen
ctx.fillStyle = '#16213e';
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.fillStyle = '#4ecca3';
ctx.font = 'bold 30px Arial';
ctx.textAlign = 'center';
ctx.fillText('🐍 Snake Game', canvas.width / 2, canvas.height / 2 - 20);

ctx.fillStyle = '#aaa';
ctx.font = '16px Arial';
ctx.fillText('Click "Start Game" to play!', canvas.width / 2, canvas.height / 2 + 20);

// Draw a decorative snake on start screen
ctx.fillStyle = '#4ecca3';
const demoSnake = [
    {x: 8, y: 16}, {x: 7, y: 16}, {x: 6, y: 16},
    {x: 6, y: 15}, {x: 6, y: 14}, {x: 7, y: 14},
    {x: 8, y: 14}, {x: 9, y: 14}, {x: 10, y: 14},
    {x: 10, y: 15}, {x: 10, y: 16}, {x: 10, y: 17}
];
demoSnake.forEach(seg => {
    ctx.fillRect(seg.x * gridSize + 2, seg.y * gridSize + 2, gridSize - 4, gridSize - 4);
});
