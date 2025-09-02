// 主游戏控制类
class Game {
    constructor() {
        // 游戏状态
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropTime = 0;
        this.dropInterval = 1000; // 初始下降间隔（毫秒）

        // 游戏组件
        this.tetris = new Tetris();
        this.controls = new Controls(this);

        // Canvas 元素
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');

        // UI 元素
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.linesElement = document.getElementById('lines');
        this.overlay = document.getElementById('gameOverlay');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayMessage = document.getElementById('overlayMessage');

        // 按钮事件
        this.bindButtons();

        // 初始化
        this.updateUI();
        this.controls.toggleMobileControls();

        // 开始游戏循环
        this.lastTime = 0;
        this.gameLoop(0);
    }

    // 绑定按钮事件
    bindButtons() {
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('pauseButton').addEventListener('click', () => {
            if (this.gameState === 'playing') {
                this.pause();
            } else if (this.gameState === 'paused') {
                this.resume();
            }
        });

        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
    }

    // 开始游戏
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropTime = 0;
        this.dropInterval = 1000;

        this.tetris.reset();
        this.hideOverlay();
        this.updateUI();
    }

    // 暂停游戏
    pause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.showOverlay('游戏暂停', '按Enter键或点击继续按钮继续游戏');
            document.getElementById('pauseButton').textContent = '继续';
        }
    }

    // 继续游戏
    resume() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.hideOverlay();
            document.getElementById('pauseButton').textContent = '暂停';
        }
    }

    // 重新开始游戏
    restartGame() {
        this.startGame();
    }

    // 游戏结束
    gameOver() {
        this.gameState = 'gameOver';
        this.showOverlay('游戏结束', `最终得分: ${this.score}`);
        document.getElementById('pauseButton').textContent = '暂停';

        // 保存最高分
        this.saveHighScore();
    }

    // 移动方块
    movePiece(dx, dy) {
        if (this.gameState !== 'playing') return false;
        return this.tetris.movePiece(dx, dy);
    }

    // 旋转方块
    rotatePiece() {
        if (this.gameState !== 'playing') return false;
        return this.tetris.rotatePiece();
    }

    // 软降（加速下降）
    softDrop() {
        if (this.gameState !== 'playing') return false;
        if (this.tetris.movePiece(0, 1)) {
            this.score += 1; // 软降得分
            this.updateUI();
            return true;
        }
        return false;
    }

    // 硬降（直接降到底部）
    hardDrop() {
        if (this.gameState !== 'playing') return;

        let dropDistance = 0;
        while (this.tetris.movePiece(0, 1)) {
            dropDistance++;
        }

        this.score += dropDistance * 2; // 硬降得分更高
        this.lockCurrentPiece();
        this.updateUI();
    }

    // 锁定当前方块
    lockCurrentPiece() {
        this.tetris.lockPiece();

        // 清除完整的行
        const linesCleared = this.tetris.clearLines();
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.addScore(linesCleared);
            this.updateLevel();
        }

        // 生成新方块
        if (!this.tetris.spawnNewPiece()) {
            this.gameOver();
            return;
        }

        this.updateUI();
    }

    // 计算得分
    addScore(linesCleared) {
        const baseScore = [0, 40, 100, 300, 1200]; // 0, 1, 2, 3, 4行的基础分数
        this.score += baseScore[linesCleared] * this.level;
    }

    // 更新等级
    updateLevel() {
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            // 随着等级增加，方块下降速度加快
            this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
        }
    }

    // 游戏主循环
    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // 更新控制器
        this.controls.update();

        // 游戏逻辑更新
        if (this.gameState === 'playing') {
            this.dropTime += deltaTime;

            if (this.dropTime >= this.dropInterval) {
                if (!this.tetris.movePiece(0, 1)) {
                    this.lockCurrentPiece();
                }
                this.dropTime = 0;
            }
        }

        // 渲染
        this.render();

        // 继续游戏循环
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    // 渲染游戏
    render() {
        // 清空画布
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 渲染游戏板
        this.renderBoard();

        // 渲染幽灵方块
        if (this.gameState === 'playing') {
            this.renderGhost();
        }

        // 渲染网格线
        this.renderGrid();

        // 渲染下一个方块
        this.renderNextPiece();
    }

    // 渲染游戏板
    renderBoard() {
        const board = this.tetris.getBoardState();
        const blockSize = this.tetris.BLOCK_SIZE;

        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                if (board[y][x] !== 0) {
                    this.ctx.fillStyle = this.tetris.colors[board[y][x]];
                    this.ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);

                    // 添加边框效果
                    this.ctx.strokeStyle = '#FFFFFF';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
                }
            }
        }
    }

    // 渲染幽灵方块
    renderGhost() {
        const ghostBoard = this.tetris.getGhostState();
        if (!ghostBoard) return;

        const blockSize = this.tetris.BLOCK_SIZE;

        for (let y = 0; y < ghostBoard.length; y++) {
            for (let x = 0; x < ghostBoard[y].length; x++) {
                if (ghostBoard[y][x] !== 0) {
                    // 半透明的幽灵方块
                    this.ctx.fillStyle = this.tetris.colors[ghostBoard[y][x]] + '40'; // 添加透明度
                    this.ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);

                    // 虚线边框
                    this.ctx.strokeStyle = this.tetris.colors[ghostBoard[y][x]];
                    this.ctx.lineWidth = 2;
                    this.ctx.setLineDash([5, 5]);
                    this.ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
                    this.ctx.setLineDash([]); // 重置线条样式
                }
            }
        }
    }

    // 渲染网格线
    renderGrid() {
        const blockSize = this.tetris.BLOCK_SIZE;

        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 0.5;

        // 垂直线
        for (let x = 0; x <= this.tetris.BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * blockSize, 0);
            this.ctx.lineTo(x * blockSize, this.tetris.BOARD_HEIGHT * blockSize);
            this.ctx.stroke();
        }

        // 水平线
        for (let y = 0; y <= this.tetris.BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * blockSize);
            this.ctx.lineTo(this.tetris.BOARD_WIDTH * blockSize, y * blockSize);
            this.ctx.stroke();
        }
    }

    // 渲染下一个方块
    renderNextPiece() {
        // 清空下一个方块画布
        this.nextCtx.fillStyle = '#000000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        if (!this.tetris.nextPiece) return;

        const piece = this.tetris.nextPiece.shape;
        const color = this.tetris.colors[this.tetris.nextPiece.color];
        const blockSize = 20; // 预览区域的方块大小

        // 计算居中位置
        const offsetX = (this.nextCanvas.width - piece[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - piece.length * blockSize) / 2;

        for (let y = 0; y < piece.length; y++) {
            for (let x = 0; x < piece[y].length; x++) {
                if (piece[y][x] !== 0) {
                    this.nextCtx.fillStyle = color;
                    this.nextCtx.fillRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize,
                        blockSize
                    );

                    // 边框
                    this.nextCtx.strokeStyle = '#FFFFFF';
                    this.nextCtx.lineWidth = 1;
                    this.nextCtx.strokeRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize,
                        blockSize
                    );
                }
            }
        }
    }

    // 更新UI
    updateUI() {
        this.scoreElement.textContent = this.score.toLocaleString();
        this.levelElement.textContent = this.level;
        this.linesElement.textContent = this.lines;
    }

    // 显示覆盖层
    showOverlay(title, message) {
        this.overlayTitle.textContent = title;
        this.overlayMessage.textContent = message;
        this.overlay.classList.remove('hidden');
    }

    // 隐藏覆盖层
    hideOverlay() {
        this.overlay.classList.add('hidden');
    }

    // 保存最高分
    saveHighScore() {
        const highScore = localStorage.getItem('tetris-high-score');
        if (!highScore || this.score > parseInt(highScore)) {
            localStorage.setItem('tetris-high-score', this.score.toString());
        }
    }

    // 获取最高分
    getHighScore() {
        return parseInt(localStorage.getItem('tetris-high-score')) || 0;
    }

    // 游戏状态检查
    isPlaying() {
        return this.gameState === 'playing';
    }

    isPaused() {
        return this.gameState === 'paused';
    }

    isGameOver() {
        return this.gameState === 'gameOver';
    }
}

// 游戏初始化
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();

    // 将游戏实例暴露到全局作用域（用于调试）
    window.tetrisGame = game;
});
