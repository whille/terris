// 双人俄罗斯方块游戏管理类
class DualPlayerGame {
    constructor() {
        // 游戏状态
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.controlsReady = true; // 现在支持键盘控制，所以总是准备好的

        // 玩家实例
        this.players = {
            1: new PlayerGame(1),
            2: new PlayerGame(2)
        };

        // 设置对手关系
        this.players[1].setOpponent(this.players[2]);
        this.players[2].setOpponent(this.players[1]);

        // 游戏控制
        this.controls = new DualPlayerControls(this);

        // UI 元素
        this.overlay1 = document.getElementById('gameOverlay1');
        this.overlay2 = document.getElementById('gameOverlay2');
        this.overlayTitle1 = document.getElementById('overlayTitle1');
        this.overlayTitle2 = document.getElementById('overlayTitle2');
        this.overlayMessage1 = document.getElementById('overlayMessage1');
        this.overlayMessage2 = document.getElementById('overlayMessage2');

        // 绑定按钮事件
        this.bindButtons();

        // 初始化UI
        this.updateUI();

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

    // 设置控制准备状态
    setControlsReady(ready) {
        this.controlsReady = ready;
        this.updateStartButtonState();
    }

    // 更新开始按钮状态
    updateStartButtonState() {
        const startButton = document.getElementById('startButton');
        if (this.controlsReady) {
            startButton.disabled = false;
            startButton.textContent = '开始对战';
            this.showOverlay('准备就绪', '使用键盘或手柄控制，点击开始按钮开始对战！');
        } else {
            startButton.disabled = true;
            startButton.textContent = '等待准备';
            this.showOverlay('等待准备', '正在初始化控制系统...');
        }
    }

    // 开始游戏
    startGame() {
        if (!this.controlsReady) {
            alert('控制系统尚未准备好！');
            return;
        }

        this.gameState = 'playing';

        // 重置两个玩家
        this.players[1].reset();
        this.players[2].reset();

        this.hideOverlay();
        this.updateUI();
    }

    // 暂停游戏
    pause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.showOverlay('游戏暂停', '按X键或点击继续按钮继续游戏');
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
        if (this.controlsReady) {
            this.startGame();
        } else {
            this.gameState = 'menu';
            this.updateStartButtonState();
        }
    }

    // 游戏结束
    gameOver(winnerId) {
        this.gameState = 'gameOver';
        const winnerName = `玩家 ${winnerId}`;
        const loserName = `玩家 ${winnerId === 1 ? 2 : 1}`;

        this.showOverlay(`🎉 ${winnerName} 获胜！`, `${loserName} 的方块堆满了！点击重新开始继续游戏`);
        document.getElementById('pauseButton').textContent = '暂停';

        // 保存游戏记录
        this.saveGameRecord(winnerId);
    }

    // 获取玩家实例
    getPlayer(playerId) {
        return this.players[playerId];
    }

    // 游戏主循环
    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // 更新控制器
        this.controls.update();

        // 游戏逻辑更新
        if (this.gameState === 'playing') {
            // 更新两个玩家
            this.players[1].update(deltaTime);
            this.players[2].update(deltaTime);

            // 检查游戏结束条件
            this.checkGameOverCondition();
        }

        // 渲染
        this.render();

        // 继续游戏循环
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    // 检查游戏结束条件
    checkGameOverCondition() {
        if (this.players[1].hasLost()) {
            this.gameOver(2); // 玩家2获胜
        } else if (this.players[2].hasLost()) {
            this.gameOver(1); // 玩家1获胜
        }
    }

    // 渲染游戏
    render() {
        this.players[1].render();
        this.players[2].render();
    }

    // 更新UI
    updateUI() {
        this.players[1].updateUI();
        this.players[2].updateUI();
    }

    // 显示覆盖层
    showOverlay(title, message) {
        // 显示在两个玩家区域
        if (this.overlayTitle1 && this.overlayMessage1) {
            this.overlayTitle1.textContent = title;
            this.overlayMessage1.textContent = message;
            this.overlay1.classList.remove('hidden');
        }

        if (this.overlayTitle2 && this.overlayMessage2) {
            this.overlayTitle2.textContent = title;
            this.overlayMessage2.textContent = message;
            this.overlay2.classList.remove('hidden');
        }
    }

    // 隐藏覆盖层
    hideOverlay() {
        if (this.overlay1) this.overlay1.classList.add('hidden');
        if (this.overlay2) this.overlay2.classList.add('hidden');
    }

    // 保存游戏记录
    saveGameRecord(winnerId) {
        const gameRecord = {
            date: new Date().toISOString(),
            winner: winnerId,
            player1Score: this.players[1].score,
            player2Score: this.players[2].score,
            player1Lines: this.players[1].lines,
            player2Lines: this.players[2].lines
        };

        // 保存到本地存储
        let records = JSON.parse(localStorage.getItem('tetris-dual-records') || '[]');
        records.unshift(gameRecord);
        records = records.slice(0, 10); // 只保留最近10场记录
        localStorage.setItem('tetris-dual-records', JSON.stringify(records));
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

// 单个玩家游戏类
class PlayerGame {
    constructor(playerId) {
        this.playerId = playerId;
        this.opponent = null;

        // 游戏状态
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropTime = 0;
        this.dropInterval = 1000;

        // 俄罗斯方块核心
        this.tetris = new PlayerTetris(playerId);

        // Canvas 元素
        this.canvas = document.getElementById(`gameCanvas${playerId}`);
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById(`nextCanvas${playerId}`);
        this.nextCtx = this.nextCanvas.getContext('2d');

        // UI 元素
        this.scoreElement = document.getElementById(`score${playerId}`);
        this.levelElement = document.getElementById(`level${playerId}`);
        this.linesElement = document.getElementById(`lines${playerId}`);
    }

    // 设置对手
    setOpponent(opponent) {
        this.opponent = opponent;
        this.tetris.setOpponent(opponent.tetris);
    }

    // 重置游戏
    reset() {
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropTime = 0;
        this.dropInterval = 1000;
        this.tetris.reset();
        this.updateUI();
    }

    // 更新游戏逻辑
    update(deltaTime) {
        if (this.tetris.hasLost()) return;

        this.dropTime += deltaTime;

        if (this.dropTime >= this.dropInterval) {
            if (!this.tetris.movePiece(0, 1)) {
                this.lockCurrentPiece();
            }
            this.dropTime = 0;
        }
    }

    // 移动方块
    movePiece(dx, dy) {
        if (this.tetris.hasLost()) return false;
        return this.tetris.movePiece(dx, dy);
    }

    // 旋转方块
    rotatePiece() {
        if (this.tetris.hasLost()) return false;
        return this.tetris.rotatePiece();
    }

    // 软降
    softDrop() {
        if (this.tetris.hasLost()) return false;
        if (this.tetris.movePiece(0, 1)) {
            this.score += 1;
            this.updateUI();
            return true;
        }
        return false;
    }

    // 硬降
    hardDrop() {
        if (this.tetris.hasLost()) return;

        let dropDistance = 0;
        while (this.tetris.movePiece(0, 1)) {
            dropDistance++;
        }

        this.score += dropDistance * 2;
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
            // 游戏结束在 tetris.spawnNewPiece() 中已经设置
        }

        this.updateUI();
    }

    // 计算得分
    addScore(linesCleared) {
        const baseScore = [0, 40, 100, 300, 1200];
        this.score += baseScore[linesCleared] * this.level;
    }

    // 更新等级
    updateLevel() {
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
        }
    }

    // 渲染游戏
    render() {
        // 清空画布
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 渲染游戏板
        this.renderBoard();

        // 渲染幽灵方块
        if (!this.tetris.hasLost()) {
            this.renderGhost();
        }

        // 渲染网格线
        this.renderGrid();

        // 渲染下一个方块
        this.renderNextPiece();

        // 如果游戏结束，添加半透明覆盖层
        if (this.tetris.hasLost()) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
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
                    this.ctx.fillStyle = this.tetris.colors[ghostBoard[y][x]] + '40';
                    this.ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);

                    // 虚线边框
                    this.ctx.strokeStyle = this.tetris.colors[ghostBoard[y][x]];
                    this.ctx.lineWidth = 2;
                    this.ctx.setLineDash([5, 5]);
                    this.ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
                    this.ctx.setLineDash([]);
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
        const blockSize = 20;

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
        if (this.scoreElement) this.scoreElement.textContent = this.score.toLocaleString();
        if (this.levelElement) this.levelElement.textContent = this.level;
        if (this.linesElement) this.linesElement.textContent = this.lines;
    }

    // 检查是否输了
    hasLost() {
        return this.tetris.hasLost();
    }
}

// 游戏初始化
document.addEventListener('DOMContentLoaded', () => {
    const game = new DualPlayerGame();

    // 将游戏实例暴露到全局作用域（用于调试）
    window.dualTetrisGame = game;
});