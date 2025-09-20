// 俄罗斯方块核心逻辑类
class Tetris {
    constructor() {
        // 游戏板尺寸
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;

        // 初始化游戏板
        this.board = this.createBoard();

        // 当前方块和位置
        this.currentPiece = null;
        this.currentX = 0;
        this.currentY = 0;

        // 下一个方块
        this.nextPiece = null;

        // 方块颜色
        this.colors = [
            '#000000', // 0: 空白
            '#FF0000', // 1: I - 红色
            '#00FF00', // 2: O - 绿色
            '#0000FF', // 3: T - 蓝色
            '#FFFF00', // 4: S - 黄色
            '#FF00FF', // 5: Z - 紫色
            '#00FFFF', // 6: J - 青色
            '#FFA500'  // 7: L - 橙色
        ];

        // 定义7种经典方块形状
        this.pieces = [
            // I 方块
            [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            // O 方块
            [
                [2, 2],
                [2, 2]
            ],
            // T 方块
            [
                [0, 3, 0],
                [3, 3, 3],
                [0, 0, 0]
            ],
            // S 方块
            [
                [0, 4, 4],
                [4, 4, 0],
                [0, 0, 0]
            ],
            // Z 方块
            [
                [5, 5, 0],
                [0, 5, 5],
                [0, 0, 0]
            ],
            // J 方块
            [
                [6, 0, 0],
                [6, 6, 6],
                [0, 0, 0]
            ],
            // L 方块
            [
                [0, 0, 7],
                [7, 7, 7],
                [0, 0, 0]
            ]
        ];

        this.generateNextPiece();
        this.spawnNewPiece();
    }

    // 创建空的游戏板
    createBoard() {
        const board = [];
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            board[y] = [];
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                board[y][x] = 0;
            }
        }
        return board;
    }

    // 生成随机方块
    generateNextPiece() {
        const pieceIndex = Math.floor(Math.random() * this.pieces.length);
        this.nextPiece = {
            shape: this.pieces[pieceIndex],
            color: pieceIndex + 1
        };
    }

    // 生成新方块
    spawnNewPiece() {
        this.currentPiece = this.nextPiece;
        this.generateNextPiece();

        // 设置初始位置
        this.currentX = Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
        this.currentY = 0;

        // 检查游戏是否结束
        if (this.isCollision(this.currentPiece.shape, this.currentX, this.currentY)) {
            return false; // 游戏结束
        }

        return true;
    }

    // 碰撞检测
    isCollision(piece, x, y) {
        for (let py = 0; py < piece.length; py++) {
            for (let px = 0; px < piece[py].length; px++) {
                if (piece[py][px] !== 0) {
                    const newX = x + px;
                    const newY = y + py;

                    // 检查边界
                    if (newX < 0 || newX >= this.BOARD_WIDTH ||
                        newY >= this.BOARD_HEIGHT) {
                        return true;
                    }

                    // 检查与已有方块的碰撞
                    if (newY >= 0 && this.board[newY][newX] !== 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // 移动方块
    movePiece(dx, dy) {
        const newX = this.currentX + dx;
        const newY = this.currentY + dy;

        if (!this.isCollision(this.currentPiece.shape, newX, newY)) {
            this.currentX = newX;
            this.currentY = newY;
            return true;
        }
        return false;
    }

    // 旋转方块
    rotatePiece() {
        const rotated = this.rotateMatrix(this.currentPiece.shape);

        if (!this.isCollision(rotated, this.currentX, this.currentY)) {
            this.currentPiece.shape = rotated;
            return true;
        }

        // 尝试踢墙（Wall Kick）
        const kicks = [[-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1]];
        for (let kick of kicks) {
            if (!this.isCollision(rotated, this.currentX + kick[0], this.currentY + kick[1])) {
                this.currentPiece.shape = rotated;
                this.currentX += kick[0];
                this.currentY += kick[1];
                return true;
            }
        }

        return false;
    }

    // 矩阵旋转（顺时针90度）
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = [];

        for (let i = 0; i < cols; i++) {
            rotated[i] = [];
            for (let j = 0; j < rows; j++) {
                rotated[i][j] = matrix[rows - 1 - j][i];
            }
        }

        return rotated;
    }

    // 固定方块到游戏板
    lockPiece() {
        for (let py = 0; py < this.currentPiece.shape.length; py++) {
            for (let px = 0; px < this.currentPiece.shape[py].length; px++) {
                if (this.currentPiece.shape[py][px] !== 0) {
                    const boardX = this.currentX + px;
                    const boardY = this.currentY + py;

                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
    }

    // 检查并清除完整的行
    clearLines() {
        let linesCleared = 0;

        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            let isFullLine = true;

            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x] === 0) {
                    isFullLine = false;
                    break;
                }
            }

            if (isFullLine) {
                // 移除这一行
                this.board.splice(y, 1);
                // 在顶部添加新的空行
                this.board.unshift(new Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++; // 重新检查当前行
            }
        }

        return linesCleared;
    }

    // 方块硬降（直接降到底部）
    hardDrop() {
        while (this.movePiece(0, 1)) {
            // 继续下降直到碰撞
        }
    }

    // 获取幽灵方块位置（显示方块将要落下的位置）
    getGhostPosition() {
        let ghostY = this.currentY;
        while (!this.isCollision(this.currentPiece.shape, this.currentX, ghostY + 1)) {
            ghostY++;
        }
        return ghostY;
    }

    // 重置游戏
    reset() {
        this.board = this.createBoard();
        this.generateNextPiece();
        this.spawnNewPiece();
    }

    // 获取游戏板状态（用于渲染）
    getBoardState() {
        // 创建游戏板副本
        const displayBoard = this.board.map(row => [...row]);

        // 添加当前方块
        if (this.currentPiece) {
            for (let py = 0; py < this.currentPiece.shape.length; py++) {
                for (let px = 0; px < this.currentPiece.shape[py].length; px++) {
                    if (this.currentPiece.shape[py][px] !== 0) {
                        const boardX = this.currentX + px;
                        const boardY = this.currentY + py;

                        if (boardX >= 0 && boardX < this.BOARD_WIDTH &&
                            boardY >= 0 && boardY < this.BOARD_HEIGHT) {
                            displayBoard[boardY][boardX] = this.currentPiece.color;
                        }
                    }
                }
            }
        }

        return displayBoard;
    }

    // 获取幽灵方块状态
    getGhostState() {
        if (!this.currentPiece) return null;

        const ghostY = this.getGhostPosition();
        const ghostBoard = this.createBoard();

        // 添加幽灵方块
        for (let py = 0; py < this.currentPiece.shape.length; py++) {
            for (let px = 0; px < this.currentPiece.shape[py].length; px++) {
                if (this.currentPiece.shape[py][px] !== 0) {
                    const boardX = this.currentX + px;
                    const boardY = ghostY + py;

                    if (boardX >= 0 && boardX < this.BOARD_WIDTH &&
                        boardY >= 0 && boardY < this.BOARD_HEIGHT) {
                        ghostBoard[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }

        return ghostBoard;
    }
}

// 玩家专用俄罗斯方块类
class PlayerTetris extends Tetris {
    constructor(playerId) {
        super();
        this.playerId = playerId;
        this.isGameOver = false;
        this.opponent = null; // 对手引用
    }

    // 设置对手引用
    setOpponent(opponent) {
        this.opponent = opponent;
    }

    // 检查游戏是否结束
    checkGameOver() {
        if (this.isGameOver) return true;

        // 检查顶部是否有方块
        for (let x = 0; x < this.BOARD_WIDTH; x++) {
            if (this.board[0][x] !== 0 || this.board[1][x] !== 0) {
                this.isGameOver = true;
                return true;
            }
        }
        return false;
    }

    // 重置游戏状态
    reset() {
        super.reset();
        this.isGameOver = false;
    }

    // 生成新方块时检查游戏结束条件
    spawnNewPiece() {
        const success = super.spawnNewPiece();
        if (!success) {
            this.isGameOver = true;
        }
        return success;
    }

    // 获取玩家ID
    getPlayerId() {
        return this.playerId;
    }

    // 检查是否输了游戏
    hasLost() {
        return this.isGameOver;
    }
}
