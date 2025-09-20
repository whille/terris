// 双人游戏控制系统 - 支持键盘和手柄混合控制
class DualPlayerControls {
    constructor(dualPlayerGame) {
        this.game = dualPlayerGame;

        // 键盘控制状态
        this.keys = {};
        this.lastKeyTime = {};
        this.keyPressed = {};
        this.keyRepeatDelay = 150;
        this.keyRepeatRate = 100;

        // 手柄控制状态
        this.gamepads = {}; // 存储已连接的手柄
        this.playerGamepads = {
            1: null, // 玩家1的手柄索引
            2: null  // 玩家2的手柄索引
        };
        this.gamepadButtons = {};
        this.lastGamepadTime = {};
        this.gamepadPressed = {};
        this.gamepadRepeatDelay = 150;
        this.gamepadRepeatRate = 100;

        // 旋转防抖
        this.rotateDebounceDelay = 150;
        this.lastRotateTime = { 1: 0, 2: 0 };

        // 绑定事件
        this.bindKeyboardEvents();
        this.bindGamepadEvents();
        this.detectConnectedGamepads();
    }

    // 绑定键盘事件
    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // 防止方向键滚动页面
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter',
                'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyJ',
                'Numpad8', 'Numpad4', 'Numpad5', 'Numpad6'].includes(e.code)) {
                e.preventDefault();
            }
        });
    }

    // 处理按键按下
    handleKeyDown(e) {
        const now = Date.now();
        const key = e.code;

        // 如果是首次按下这个键
        if (!this.keys[key]) {
            this.keys[key] = true;
            this.keyPressed[key] = true;
            this.lastKeyTime[key] = now;
            this.processKeyAction(key);
        }
    }

    // 处理按键释放
    handleKeyUp(e) {
        this.keys[e.code] = false;
        this.keyPressed[e.code] = false;
    }

    // 处理按键动作
    processKeyAction(key) {
        const now = Date.now();

        switch (key) {
            // 玩家1控制 (WASD + J)
            case 'KeyA': // 左移
                if (this.game.isPlaying()) this.game.getPlayer(1).movePiece(-1, 0);
                break;
            case 'KeyD': // 右移
                if (this.game.isPlaying()) this.game.getPlayer(1).movePiece(1, 0);
                break;
            case 'KeyS': // 下降
                if (this.game.isPlaying()) this.game.getPlayer(1).softDrop();
                break;
            case 'KeyW': // 旋转
                if (this.game.isPlaying() && (now - this.lastRotateTime[1]) >= this.rotateDebounceDelay) {
                    this.lastRotateTime[1] = now;
                    this.game.getPlayer(1).rotatePiece();
                }
                break;
            case 'KeyJ': // 硬降
                if (this.game.isPlaying()) this.game.getPlayer(1).hardDrop();
                break;

            // 玩家2控制 (方向键 + 小键盘 + 空格)
            case 'ArrowLeft': // 左移
            case 'Numpad4': // 左移
                if (this.game.isPlaying()) this.game.getPlayer(2).movePiece(-1, 0);
                break;
            case 'ArrowRight': // 右移
            case 'Numpad6': // 右移
                if (this.game.isPlaying()) this.game.getPlayer(2).movePiece(1, 0);
                break;
            case 'ArrowDown': // 下降
            case 'Numpad5': // 下降
                if (this.game.isPlaying()) this.game.getPlayer(2).softDrop();
                break;
            case 'ArrowUp': // 旋转
            case 'Numpad8': // 旋转
                if (this.game.isPlaying() && (now - this.lastRotateTime[2]) >= this.rotateDebounceDelay) {
                    this.lastRotateTime[2] = now;
                    this.game.getPlayer(2).rotatePiece();
                }
                break;
            case 'Space': // 硬降
                if (this.game.isPlaying()) this.game.getPlayer(2).hardDrop();
                break;

            // 游戏控制
            case 'Enter': // 暂停/继续
                if (this.game.isPaused()) {
                    this.game.resume();
                } else if (this.game.isPlaying()) {
                    this.game.pause();
                }
                break;
        }
    }

    // 绑定手柄事件
    bindGamepadEvents() {
        window.addEventListener('gamepadconnected', (e) => {
            console.log('手柄已连接:', e.gamepad.id);
            this.gamepads[e.gamepad.index] = e.gamepad;
            this.assignGamepadToPlayer(e.gamepad.index);
            this.showGamepadStatus(`✅ 手柄已连接: ${e.gamepad.id}`);
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('手柄已断开:', e.gamepad.id);
            this.removeGamepad(e.gamepad.index);
            this.showGamepadStatus('❌ 手柄已断开');
        });
    }

    // 分配手柄给玩家
    assignGamepadToPlayer(gamepadIndex) {
        // 优先分配给玩家1，如果玩家1已有手柄，则分配给玩家2
        if (this.playerGamepads[1] === null) {
            this.playerGamepads[1] = gamepadIndex;
            this.updateGamepadStatus(1, true);
            console.log(`手柄 ${gamepadIndex} 分配给玩家1`);
        } else if (this.playerGamepads[2] === null) {
            this.playerGamepads[2] = gamepadIndex;
            this.updateGamepadStatus(2, true);
            console.log(`手柄 ${gamepadIndex} 分配给玩家2`);
        }

        // 检查是否两个手柄都已连接
        this.checkBothGamepadsConnected();
    }

    // 移除手柄
    removeGamepad(gamepadIndex) {
        delete this.gamepads[gamepadIndex];
        delete this.gamepadButtons[gamepadIndex];
        delete this.lastGamepadTime[gamepadIndex];
        delete this.gamepadPressed[gamepadIndex];

        // 从玩家分配中移除
        if (this.playerGamepads[1] === gamepadIndex) {
            this.playerGamepads[1] = null;
            this.updateGamepadStatus(1, false);
        } else if (this.playerGamepads[2] === gamepadIndex) {
            this.playerGamepads[2] = null;
            this.updateGamepadStatus(2, false);
        }

        this.checkBothGamepadsConnected();
    }

    // 更新手柄连接状态显示
    updateGamepadStatus(playerId, connected) {
        const statusElement = document.getElementById(`gamepadStatus${playerId}`);
        if (statusElement) {
            const span = statusElement.querySelector('span');
            if (connected) {
                span.textContent = '🎮 手柄已连接';
                statusElement.className = 'gamepad-status connected';
            } else {
                span.textContent = '🔌 等待手柄连接';
                statusElement.className = 'gamepad-status disconnected';
            }
        }
    }

    // 检查手柄连接状态（现在不强制要求两个手柄）
    checkBothGamepadsConnected() {
        // 游戏现在支持键盘控制，所以总是可以开始
        this.game.setControlsReady(true);

        const connectedCount = this.getConnectedGamepadsCount();
        if (connectedCount > 0) {
            console.log(`${connectedCount}个手柄已连接，支持键盘+手柄混合控制`);
        }
    }

    // 更新输入 - 键盘和手柄
    update() {
        const now = Date.now();

        // 更新键盘连续按键
        this.updateKeyboardInput(now);

        // 更新手柄输入
        this.updateGamepadInput(now);
    }

    // 更新键盘连续按键
    updateKeyboardInput(now) {
        for (let key in this.keys) {
            if (this.keys[key] && this.keyPressed[key]) {
                // 检查是否达到重复延迟时间
                if ((now - this.lastKeyTime[key]) >= this.keyRepeatDelay) {
                    this.lastKeyTime[key] = now;

                    // 只对移动和下降键启用连续按键
                    if (['KeyA', 'KeyD', 'KeyS', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'Numpad4', 'Numpad6', 'Numpad5'].includes(key)) {
                        this.processKeyAction(key);
                    }
                }
            }
        }
    }

    // 更新手柄输入
    updateGamepadInput(now) {
        const gamepads = navigator.getGamepads();

        // 更新手柄状态
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (!gamepad) continue;

            this.gamepads[i] = gamepad;

            // 初始化手柄按键状态
            if (!this.gamepadButtons[i]) {
                this.gamepadButtons[i] = {};
                this.lastGamepadTime[i] = {};
                this.gamepadPressed[i] = {};
            }

            // 检查按键状态
            this.checkGamepadButtons(gamepad, i, now);
        }
    }

    // 检查手柄按键
    checkGamepadButtons(gamepad, gamepadIndex, now) {
        // 确定这个手柄属于哪个玩家
        let playerId = null;
        if (this.playerGamepads[1] === gamepadIndex) {
            playerId = 1;
        } else if (this.playerGamepads[2] === gamepadIndex) {
            playerId = 2;
        }

        if (playerId === null) return; // 手柄未分配给任何玩家

        // Xbox手柄按键映射
        const buttonMap = {
            0: 'A',      // A键 - 硬降
            1: 'B',      // B键 - 旋转
            2: 'X',      // X键 - 暂停
            3: 'Y',      // Y键 - 保留
            12: 'Up',    // 方向键上 - 旋转
            13: 'Down',  // 方向键下 - 软降
            14: 'Left',  // 方向键左 - 左移
            15: 'Right', // 方向键右 - 右移
        };

        for (let buttonIndex in buttonMap) {
            const button = gamepad.buttons[buttonIndex];
            const buttonName = buttonMap[buttonIndex];

            if (button && button.pressed) {
                // 如果是首次按下
                if (!this.gamepadButtons[gamepadIndex][buttonName]) {
                    this.gamepadButtons[gamepadIndex][buttonName] = true;
                    this.gamepadPressed[gamepadIndex][buttonName] = true;
                    this.lastGamepadTime[gamepadIndex][buttonName] = now;

                    // 对旋转操作进行防抖动处理
                    if (buttonName === 'Up' || buttonName === 'B') {
                        if ((now - this.lastRotateTime[playerId]) >= this.rotateDebounceDelay) {
                            this.lastRotateTime[playerId] = now;
                            this.processGamepadAction(playerId, buttonName);
                        }
                    } else {
                        this.processGamepadAction(playerId, buttonName);
                    }
                }
                // 检查连续按键
                else if (this.gamepadPressed[gamepadIndex][buttonName]) {
                    if ((now - this.lastGamepadTime[gamepadIndex][buttonName]) >= this.gamepadRepeatDelay) {
                        this.lastGamepadTime[gamepadIndex][buttonName] = now;

                        // 只对移动和下降键启用连续按键
                        if (['Left', 'Right', 'Down'].includes(buttonName)) {
                            this.processGamepadAction(playerId, buttonName);
                        }
                    }
                }
            } else {
                this.gamepadButtons[gamepadIndex][buttonName] = false;
                this.gamepadPressed[gamepadIndex][buttonName] = false;
            }
        }

        // 检查摇杆输入
        this.checkGamepadSticks(gamepad, gamepadIndex, playerId, now);
    }

    // 检查摇杆输入
    checkGamepadSticks(gamepad, gamepadIndex, playerId, now) {
        const leftStickX = gamepad.axes[0];
        const leftStickY = gamepad.axes[1];
        const deadzone = 0.3; // 死区

        // 初始化摇杆状态
        if (!this.gamepadButtons[gamepadIndex]['StickLeft']) {
            this.gamepadButtons[gamepadIndex]['StickLeft'] = false;
            this.gamepadButtons[gamepadIndex]['StickRight'] = false;
            this.gamepadButtons[gamepadIndex]['StickDown'] = false;
            this.gamepadButtons[gamepadIndex]['StickUp'] = false;
            this.lastGamepadTime[gamepadIndex]['StickLeft'] = 0;
            this.lastGamepadTime[gamepadIndex]['StickRight'] = 0;
            this.lastGamepadTime[gamepadIndex]['StickDown'] = 0;
            this.lastGamepadTime[gamepadIndex]['StickUp'] = 0;
        }

        // 左摇杆水平移动
        if (leftStickX < -deadzone) {
            if (!this.gamepadButtons[gamepadIndex]['StickLeft'] ||
                (now - this.lastGamepadTime[gamepadIndex]['StickLeft']) >= this.gamepadRepeatRate) {
                this.gamepadButtons[gamepadIndex]['StickLeft'] = true;
                this.lastGamepadTime[gamepadIndex]['StickLeft'] = now;
                this.processGamepadAction(playerId, 'Left');
            }
        } else {
            this.gamepadButtons[gamepadIndex]['StickLeft'] = false;
        }

        if (leftStickX > deadzone) {
            if (!this.gamepadButtons[gamepadIndex]['StickRight'] ||
                (now - this.lastGamepadTime[gamepadIndex]['StickRight']) >= this.gamepadRepeatRate) {
                this.gamepadButtons[gamepadIndex]['StickRight'] = true;
                this.lastGamepadTime[gamepadIndex]['StickRight'] = now;
                this.processGamepadAction(playerId, 'Right');
            }
        } else {
            this.gamepadButtons[gamepadIndex]['StickRight'] = false;
        }

        // 左摇杆垂直移动
        if (leftStickY > deadzone) {
            if (!this.gamepadButtons[gamepadIndex]['StickDown'] ||
                (now - this.lastGamepadTime[gamepadIndex]['StickDown']) >= this.gamepadRepeatRate) {
                this.gamepadButtons[gamepadIndex]['StickDown'] = true;
                this.lastGamepadTime[gamepadIndex]['StickDown'] = now;
                this.processGamepadAction(playerId, 'Down');
            }
        } else {
            this.gamepadButtons[gamepadIndex]['StickDown'] = false;
        }

        if (leftStickY < -deadzone) {
            // 摇杆向上只触发一次，不重复（用于旋转）
            if (!this.gamepadButtons[gamepadIndex]['StickUp']) {
                this.gamepadButtons[gamepadIndex]['StickUp'] = true;
                this.lastGamepadTime[gamepadIndex]['StickUp'] = now;

                // 对摇杆旋转操作进行防抖动处理
                if ((now - this.lastRotateTime[playerId]) >= this.rotateDebounceDelay) {
                    this.lastRotateTime[playerId] = now;
                    this.processGamepadAction(playerId, 'Up');
                }
            }
        } else {
            this.gamepadButtons[gamepadIndex]['StickUp'] = false;
        }
    }

    // 处理手柄按键动作
    processGamepadAction(playerId, action) {
        const player = this.game.getPlayer(playerId);
        if (!player) return;

        switch (action) {
            case 'Left':
                if (this.game.isPlaying()) player.movePiece(-1, 0);
                break;
            case 'Right':
                if (this.game.isPlaying()) player.movePiece(1, 0);
                break;
            case 'Down':
                if (this.game.isPlaying()) player.softDrop();
                break;
            case 'Up':
            case 'B':
                if (this.game.isPlaying()) player.rotatePiece();
                break;
            case 'A':
                if (this.game.isPlaying()) player.hardDrop();
                break;
            case 'X':
                if (this.game.isPaused()) {
                    this.game.resume();
                } else {
                    this.game.pause();
                }
                break;
        }
    }

    // 显示手柄状态
    showGamepadStatus(message) {
        let statusElement = document.getElementById('gamepadStatus');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'gamepadStatus';
            statusElement.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-size: 14px;
                z-index: 1000;
                transition: opacity 0.3s;
            `;
            document.body.appendChild(statusElement);
        }

        statusElement.textContent = message;
        statusElement.style.opacity = '1';

        // 3秒后淡出
        setTimeout(() => {
            statusElement.style.opacity = '0';
        }, 3000);
    }

    // 检测已连接的手柄
    detectConnectedGamepads() {
        const gamepads = navigator.getGamepads();

        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (gamepad) {
                this.gamepads[i] = gamepad;
                this.assignGamepadToPlayer(i);
                console.log('检测到已连接的手柄:', gamepad.id);
            }
        }

        if (Object.keys(this.gamepads).length > 0) {
            this.showGamepadStatus('🎮 检测到已连接的手柄');
        }
    }

    // 获取连接的手柄数量
    getConnectedGamepadsCount() {
        return Object.keys(this.gamepads).length;
    }

    // 检查两个手柄是否都已连接
    areBothGamepadsConnected() {
        return this.playerGamepads[1] !== null && this.playerGamepads[2] !== null;
    }

    // 销毁控制器
    destroy() {
        // 清理手柄状态显示
        const statusElement = document.getElementById('gamepadStatus');
        if (statusElement) {
            statusElement.remove();
        }
    }
}