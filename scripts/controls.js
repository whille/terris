// 游戏控制系统
class Controls {
    constructor(game) {
        this.game = game;
        this.keys = {};
        this.lastKeyTime = {};
        this.keyRepeatDelay = 150; // 按键重复延迟（毫秒）
        this.keyRepeatRate = 100;  // 按键重复率（毫秒）- 调慢一些
        this.keyPressed = {};      // 跟踪按键是否已经处理过首次按下

        // 手柄相关
        this.gamepads = {};
        this.gamepadButtons = {};
        this.lastGamepadTime = {};
        this.gamepadRepeatDelay = 150; // 手柄按键重复延迟（与键盘一致）
        this.gamepadRepeatRate = 100;  // 手柄按键重复率（与键盘一致）
        this.gamepadPressed = {};      // 跟踪手柄按键是否已处理
        this.rotateDebounceDelay = 150; // 旋转操作防抖动延迟（与键盘一致）
        this.lastRotateTime = 0;       // 上次旋转操作时间

        this.bindEvents();
        this.bindMobileControls();
        this.bindGamepadEvents();

        // 检测已连接的手柄
        this.detectConnectedGamepads();
    }

    // 绑定键盘事件
    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // 防止方向键滚动页面
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].includes(e.code)) {
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
        switch (key) {
            case 'ArrowLeft':
                if (this.game.isPlaying()) this.game.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                if (this.game.isPlaying()) this.game.movePiece(1, 0);
                break;
            case 'ArrowDown':
                if (this.game.isPlaying()) this.game.softDrop();
                break;
            case 'ArrowUp':
                if (this.game.isPlaying()) this.game.rotatePiece();
                break;
            case 'Space':
                // 空格键改为硬降
                if (this.game.isPlaying()) this.game.hardDrop();
                break;
            case 'Enter':
                // Enter键改为暂停/继续
                if (this.game.isPaused()) {
                    this.game.resume();
                } else {
                    this.game.pause();
                }
                break;
        }
    }

    // 更新连续按键和手柄输入
    update() {
        const now = Date.now();

        // 键盘连续按键
        for (let key in this.keys) {
            if (this.keys[key] && this.keyPressed[key]) {
                // 检查是否达到重复延迟时间
                if ((now - this.lastKeyTime[key]) >= this.keyRepeatDelay) {
                    this.lastKeyTime[key] = now;

                    // 只对移动和下降键启用连续按键
                    if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowDown') {
                        this.processKeyAction(key);
                    }
                }
            }
        }

        // 更新手柄输入
        this.updateGamepads();
    }

    // 绑定移动设备控制
    bindMobileControls() {
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const downBtn = document.getElementById('downBtn');
        const rotateBtn = document.getElementById('rotateBtn');
        const hardDropBtn = document.getElementById('hardDropBtn');

        if (leftBtn) {
            this.addTouchEvents(leftBtn, () => this.game.movePiece(-1, 0));
        }

        if (rightBtn) {
            this.addTouchEvents(rightBtn, () => this.game.movePiece(1, 0));
        }

        if (downBtn) {
            this.addTouchEvents(downBtn, () => this.game.softDrop());
        }

        if (rotateBtn) {
            this.addTouchEvents(rotateBtn, () => this.game.rotatePiece(), false);
        }

        if (hardDropBtn) {
            this.addTouchEvents(hardDropBtn, () => this.game.hardDrop(), false);
        }
    }

    // 添加触摸事件
    addTouchEvents(element, action, repeatable = true) {
        let touchInterval;
        let initialDelay = 200;
        let repeatRate = 100;

        const startAction = () => {
            if (!this.game.isPlaying()) return;

            action();

            if (repeatable) {
                setTimeout(() => {
                    touchInterval = setInterval(() => {
                        if (this.game.isPlaying()) {
                            action();
                        }
                    }, repeatRate);
                }, initialDelay);
            }
        };

        const stopAction = () => {
            if (touchInterval) {
                clearInterval(touchInterval);
                touchInterval = null;
            }
        };

        // 触摸事件
        element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startAction();
        });

        element.addEventListener('touchend', stopAction);
        element.addEventListener('touchcancel', stopAction);

        // 鼠标事件（用于测试）
        element.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startAction();
        });

        element.addEventListener('mouseup', stopAction);
        element.addEventListener('mouseleave', stopAction);
    }

    // 检测是否为移动设备
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    }

    // 显示/隐藏移动控制
    toggleMobileControls() {
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            if (this.isMobileDevice()) {
                mobileControls.style.display = 'block';
            } else {
                mobileControls.style.display = 'none';
            }
        }
    }

    // 绑定手柄事件
    bindGamepadEvents() {
        window.addEventListener('gamepadconnected', (e) => {
            console.log('手柄已连接:', e.gamepad.id);
            this.gamepads[e.gamepad.index] = e.gamepad;
            this.showGamepadStatus(`✅ 手柄已连接: ${e.gamepad.id}`);
            this.updateGamepadConnectionStatus(true);
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('手柄已断开:', e.gamepad.id);
            delete this.gamepads[e.gamepad.index];
            delete this.gamepadButtons[e.gamepad.index];
            delete this.lastGamepadTime[e.gamepad.index];
            delete this.gamepadPressed[e.gamepad.index];
            this.showGamepadStatus('❌ 手柄已断开');
            this.updateGamepadConnectionStatus(false);
        });
    }

    // 更新手柄状态
    updateGamepads() {
        const gamepads = navigator.getGamepads();
        const now = Date.now();

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
        // Xbox手柄按键映射
        const buttonMap = {
            0: 'A',      // A键 - 旋转
            1: 'B',      // B键 - 硬降
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
                    if (buttonName === 'Up' || buttonName === 'A') {
                        if ((now - this.lastRotateTime) >= this.rotateDebounceDelay) {
                            this.lastRotateTime = now;
                            this.processGamepadAction(buttonName);
                        }
                    } else {
                        this.processGamepadAction(buttonName);
                    }
                }
                // 检查连续按键
                else if (this.gamepadPressed[gamepadIndex][buttonName]) {
                    if ((now - this.lastGamepadTime[gamepadIndex][buttonName]) >= this.gamepadRepeatDelay) {
                        this.lastGamepadTime[gamepadIndex][buttonName] = now;

                        // 只对移动和下降键启用连续按键
                        if (['Left', 'Right', 'Down'].includes(buttonName)) {
                            this.processGamepadAction(buttonName);
                        }
                    }
                }
            } else {
                this.gamepadButtons[gamepadIndex][buttonName] = false;
                this.gamepadPressed[gamepadIndex][buttonName] = false;
            }
        }

        // 检查摇杆输入
        this.checkGamepadSticks(gamepad, gamepadIndex, now);
    }

    // 检查摇杆输入
    checkGamepadSticks(gamepad, gamepadIndex, now) {
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
                this.processGamepadAction('Left');
            }
        } else {
            this.gamepadButtons[gamepadIndex]['StickLeft'] = false;
        }

        if (leftStickX > deadzone) {
            if (!this.gamepadButtons[gamepadIndex]['StickRight'] ||
                (now - this.lastGamepadTime[gamepadIndex]['StickRight']) >= this.gamepadRepeatRate) {
                this.gamepadButtons[gamepadIndex]['StickRight'] = true;
                this.lastGamepadTime[gamepadIndex]['StickRight'] = now;
                this.processGamepadAction('Right');
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
                this.processGamepadAction('Down');
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
                if ((now - this.lastRotateTime) >= this.rotateDebounceDelay) {
                    this.lastRotateTime = now;
                    this.processGamepadAction('Up');
                }
            }
        } else {
            this.gamepadButtons[gamepadIndex]['StickUp'] = false;
        }
    }

    // 处理手柄按键动作
    processGamepadAction(action) {
        switch (action) {
            case 'Left':
                if (this.game.isPlaying()) this.game.movePiece(-1, 0);
                break;
            case 'Right':
                if (this.game.isPlaying()) this.game.movePiece(1, 0);
                break;
            case 'Down':
                if (this.game.isPlaying()) this.game.softDrop();
                break;
            case 'Up':
            case 'A':
                if (this.game.isPlaying()) this.game.rotatePiece();
                break;
            case 'B':
                if (this.game.isPlaying()) this.game.hardDrop();
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

    // 更新手柄连接状态显示
    updateGamepadConnectionStatus(connected) {
        const statusElement = document.getElementById('gamepadConnectionStatus');
        if (statusElement) {
            const span = statusElement.querySelector('span');
            if (connected) {
                span.textContent = '🎮 Xbox手柄已连接';
                statusElement.className = 'gamepad-status connected';
            } else {
                span.textContent = '🔌 请连接Xbox蓝牙手柄';
                statusElement.className = 'gamepad-status disconnected';
            }
        }
    }

    // 检测已连接的手柄
    detectConnectedGamepads() {
        const gamepads = navigator.getGamepads();
        let hasConnectedGamepad = false;

        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (gamepad) {
                this.gamepads[i] = gamepad;
                hasConnectedGamepad = true;
                console.log('检测到已连接的手柄:', gamepad.id);
            }
        }

        this.updateGamepadConnectionStatus(hasConnectedGamepad);

        if (hasConnectedGamepad) {
            this.showGamepadStatus('🎮 检测到已连接的Xbox手柄');
        }
    }

    // 获取连接的手柄数量
    getConnectedGamepads() {
        return Object.keys(this.gamepads).length;
    }

    // 销毁控制器
    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);

        // 清理移动控制事件
        const buttons = ['leftBtn', 'rightBtn', 'downBtn', 'rotateBtn', 'hardDropBtn'];
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.replaceWith(btn.cloneNode(true)); // 移除所有事件监听器
            }
        });

        // 清理手柄状态显示
        const statusElement = document.getElementById('gamepadStatus');
        if (statusElement) {
            statusElement.remove();
        }
    }
}
