// ============================================================
//  basicui.js  -  原有交互逻辑（修改版）
//  改动：删除重复的校验代码，改为调用 userinput.js 的校验函数；
//        为登录/注册表单添加 submit 事件；
//        在切换 Tab 和勾选复选框后触发校验。
//  新增：手机端抽屉控制（打开/关闭/遮罩点击）
// ============================================================

// ═══ 修改点 1：使用自执行函数避免污染，但保留原有变量 ═══
(function () {
    'use strict';
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const getVal = (el) => el ? el.value.trim() : '';

    const loginUsername = $('#loginUsernameOrEmail');
    const loginPassword = $('#loginPassword');
    const loginAgreement = $('.loginAgreement .checkbox');
    const loginBtn = $('.loginBtn');

    const regUsername = $('#regUsername');
    const regEmail = $('#regEmail');
    const regPassword = $('#regPassword');
    const regPasswordConfirm = $('#regPasswordConfirm');
    const regAgreement = $('.regAgreement .checkbox');
    const regBtn = $('.regBtn');
    const params = new URLSearchParams(window.location.search);

    // ═══ 新增：抽屉相关 DOM 引用 ═══
    const drawerOverlay = document.getElementById('drawerOverlay');
    const outcard = document.getElementById('outcard');
    const closeBtn = document.querySelector('.card-close');

    // ═══ 新增：工具函数 - 检测是否为手机 ═══
    function isMobile() {
        return window.innerWidth < 768;
    }

    // ═══ 新增：抽屉控制函数 ═══
    function openDrawer() {
        if (!isMobile()) return;
        if (drawerOverlay) drawerOverlay.classList.add('active');
        if (outcard) outcard.classList.add('open');
        // 防止背景滚动
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer(notifyParent = true) {
        if (!isMobile()) {
            // 非手机模式，直接通知关闭
            if (notifyParent) {
                window.parent.postMessage(JSON.stringify({ action: 'closeWindow' }), '*');
            }
            return;
        }
        // 手机模式：执行关闭动画
        if (drawerOverlay) drawerOverlay.classList.remove('active');
        if (outcard) outcard.classList.remove('open');
        document.body.style.overflow = '';
        // 等待动画结束后通知父页面
        if (notifyParent) {
            setTimeout(() => {
                window.parent.postMessage(JSON.stringify({ action: 'closeWindow' }), '*');
            }, 400);
        }
    }

    // ═══ 新增：点击遮罩关闭抽屉 ═══
    if (drawerOverlay) {
        drawerOverlay.addEventListener('click', function (e) {
            if (e.target === this) {
                closeDrawer(true);
            }
        });
    }

    // ═══ 新增：窗口尺寸变化时，自动适配模式 ═══
    let resizeTimer = null;
    function handleResize() {
        if (resizeTimer) {
            clearTimeout(resizeTimer);
            resizeTimer = null;
        }
        resizeTimer = setTimeout(function () {
            const mobile = isMobile();
            if (mobile) {
                // 切换到手机模式：如果抽屉未打开则打开
                if (drawerOverlay && !drawerOverlay.classList.contains('active')) {
                    openDrawer();
                }
            } else {
                // 切换到PC模式：关闭抽屉，重置样式
                if (drawerOverlay) {
                    drawerOverlay.classList.remove('active');
                    drawerOverlay.style.display = 'none';
                }
                if (outcard) {
                    outcard.classList.remove('open');
                    outcard.style.transform = '';
                }
                document.body.style.overflow = '';
            }
        }, 200);
    }

    // ---------- 关闭按钮 ----------
    if (closeBtn) {
        closeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            closeDrawer(true);
        });
    }

    // ---------- Tab 切换 ----------
    document.querySelector('.register.nav-item').addEventListener('click', function () {
        document.querySelector('.login.nav-item').classList.remove('active');
        document.querySelector('.register.nav-item').classList.add('active');
        document.querySelector('.register-form.form').classList.add('active-form');
        document.querySelector('.login-form.form').classList.remove('active-form');
        document.querySelector('.active-bar').style.transform = 'translateX(213px)';

        if (window._validateRegister) window._validateRegister();

        // 手机端切换 Tab 后，确保抽屉内容滚动到顶部
        if (isMobile() && outcard) {
            outcard.scrollTop = 0;
        }
    });

    document.querySelector('.login.nav-item').addEventListener('click', function () {
        document.querySelector('.login.nav-item').classList.add('active');
        document.querySelector('.register-form.form').classList.remove('active-form');
        document.querySelector('.login-form.form').classList.add('active-form');
        document.querySelector('.register.nav-item').classList.remove('active');
        document.querySelector('.active-bar').style.transform = 'translateX(94.4px)';

        if (window._validateLogin) window._validateLogin();

        // 手机端切换 Tab 后，确保抽屉内容滚动到顶部
        if (isMobile() && outcard) {
            outcard.scrollTop = 0;
        }
    });

    // ---------- 复选框 ----------
    function toggleCheckbox(checkbox) {
        if (!checkbox) return;
        if (checkbox.classList.contains('checked')) {
            checkbox.classList.remove('checked');
        } else {
            checkbox.classList.add('checked');
        }

        checkbox.setAttribute('aria-checked', checkbox.classList.contains('checked') ? 'true' : 'false');

        const isLoginActive = document.querySelector('.login-form.form').classList.contains('active-form');
        if (isLoginActive) {
            if (window._validateLogin) window._validateLogin();
        } else {
            if (window._validateRegister) window._validateRegister();
        }
    }

    // 注册协议复选框
    document.querySelector('.regAgreement').addEventListener('click', function (e) {
        if (e.target.tagName === 'A') return;
        const checkbox = document.querySelector('.regAgreement .checkbox');
        toggleCheckbox(checkbox);
    });

    document.querySelector('.loginAgreement').addEventListener('click', function (e) {
        if (e.target.tagName === 'A') return;
        const checkbox = document.querySelector('.loginAgreement .checkbox');
        toggleCheckbox(checkbox);
    });

    // ═══ 修改点 5：为登录和注册表单添加 submit 事件处理 ═══
    const loginForm = document.querySelector('.login-form.form');
    const registerForm = document.querySelector('.register-form.form');

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            // 调用校验（如果校验不通过则不提交）
            if (window._validateLogin) {
                const result = window._validateLogin();
                if (!result.valid) {
                    loginBtn.blur();
                    showResult(result.msg);
                    return;
                }
            }

            showResult('请稍后...', 'loading', 0);
            window.parent.postMessage(
                JSON.stringify({
                    action: 'login',
                    username: getVal(loginUsername),
                    password: getVal(loginPassword),
                }),
                '*'
            );
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            // 调用校验，并获取详细错误信息
            if (window._validateRegister) {
                const result = window._validateRegister();
                if (!result.valid) {
                    regBtn.blur();
                    showResult(result.msg);
                    return;
                }
            }
            showResult('请稍后...', 'loading', 0);
            window.parent.postMessage(
                JSON.stringify({
                    action: 'register',
                    username: getVal(regUsername),
                    email: getVal(regEmail),
                    password: getVal(regPassword),
                }),
                '*'
            );
        });
    }

    // ---------- 遇到问题 ----------
    document.querySelector('.haveQuestion').addEventListener('click', function () {
        showResult('无法加载');
    });

    // ---------- 消息监听 ----------
    window.addEventListener('message', async function (event) {
        let data = event.data;
        // 如果是字符串，保持兼容；如果是 JSON 字符串，解析
        if (typeof data === 'string' && data.startsWith('{')) {
            try {
                data = JSON.parse(data);
            } catch (e) {
                /* 忽略 */
            }
        }

        // 处理对象
        if (typeof data === 'object' && data.action) {
            switch (data.action) {
                case 'registerSuccess':
                    closeToast();
                    showResult('注册成功');
                    break;
                case 'registerFailure':
                    closeToast();
                    showResult(data.message || '注册失败');
                    break;
                case 'loginSuccess':
                    closeToast();
                    showResult('登录成功', 'info', 1000);
                    setTimeout(
                        () => window.parent.postMessage(JSON.stringify({ action: 'closeWindow' }), '*'),
                        1000
                    );
                    break;
                case 'loginFailure':
                    closeToast();
                    showResult(data.message || '登录失败');
                    break;
                default:
                    console.log('未知消息', data);
            }
        } else {
            // 兼容旧版纯字符串消息（如 "registerSuccess"）
            switch (data) {
                case 'registerSuccess':
                    closeToast();
                    showResult('注册成功');
                    break;
                case 'registerFailure':
                    closeToast();
                    showResult('注册失败');
                    break;
                case 'loginSuccess':
                    closeToast();
                    showResult('登录成功', 'info', 1000);
                    setTimeout(
                        () => window.parent.postMessage(JSON.stringify({ action: 'closeWindow' }), '*'),
                        1000
                    );
                    break;
                case 'loginFailure':
                    closeToast();
                    showResult('登录失败');
                    break;
                default:
                    console.log('不能够处理的消息', data);
            }
        }
    });

    // ---------- 初始化 ----------
    function init() {
        // 如果 URL 参数指定 tab=register，则切换到注册
        if (params.get('tab') === 'register') {
            document.querySelector('.register.nav-item').click();
        }

        // 手机端：自动打开抽屉
        if (isMobile()) {
            // 延迟一帧确保 DOM 渲染完成
            requestAnimationFrame(function () {
                // 确保遮罩显示
                if (drawerOverlay) {
                    drawerOverlay.style.display = '';
                }
                openDrawer();
            });
        } else {
            // PC端：隐藏遮罩
            if (drawerOverlay) {
                drawerOverlay.style.display = 'none';
            }
        }

        // 监听窗口尺寸变化
        window.addEventListener('resize', handleResize);

        // 监听 orientation change（移动端旋转）
        window.addEventListener('orientationchange', function () {
            setTimeout(handleResize, 300);
        });
    }

    // DOM 就绪后执行初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ═══ 暴露抽屉控制函数（方便调试/扩展） ═══
    window.__drawer = {
        open: openDrawer,
        close: closeDrawer,
        isMobile: isMobile,
    };
})();