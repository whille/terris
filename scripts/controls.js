// 游戏控制系统
class Controls {
        constructor(game) {
        this.game = game;
        this.keys = {};
        this.lastKeyTime = {};
        this.keyRepeatDelay = 150; // 按键重复延迟（毫秒）
        this.keyRepeatRate = 100;  // 按键重复率（毫秒）- 调慢一些
        this.keyPressed = {};      // 跟踪按键是否已经处理过首次按下

        this.bindEvents();
        this.bindMobileControls();
    }

    // 绑定键盘事件
    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // 防止方向键滚动页面
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
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
        if (!this.game.isPlaying()) return;

        switch (key) {
            case 'ArrowLeft':
                this.game.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                this.game.movePiece(1, 0);
                break;
            case 'ArrowDown':
                this.game.softDrop();
                break;
            case 'ArrowUp':
                this.game.rotatePiece();
                break;
            case 'Space':
                if (this.game.isPaused()) {
                    this.game.resume();
                } else {
                    this.game.pause();
                }
                break;
            case 'KeyC':
                // 硬降（可选功能）
                this.game.hardDrop();
                break;
        }
    }

        // 更新连续按键
    update() {
        const now = Date.now();

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
    }
}
