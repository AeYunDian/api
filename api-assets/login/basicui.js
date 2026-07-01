// ============================================================
//  basicui.js  -  原有交互逻辑（修改版）
//  改动：删除重复的校验代码，改为调用 userinput.js 的校验函数；
//        为登录/注册表单添加 submit 事件；
//        在切换 Tab 和勾选复选框后触发校验。
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

    // ---------- 关闭按钮 ----------
    document.querySelector(".card-close").addEventListener("click", () => {
        window.parent.postMessage(JSON.stringify({ action: "closeWindow" }), "*");
    });

    // ---------- Tab 切换 ----------
    document.querySelector(".register.nav-item").addEventListener("click", () => {
        document.querySelector(".login.nav-item").classList.remove("active");
        document.querySelector(".register.nav-item").classList.add("active");
        document.querySelector(".register-form.form").classList.add("active-form");
        document.querySelector(".login-form.form").classList.remove("active-form");
        document.querySelector(".active-bar").style.transform = "translateX(213px)";

        if (window._validateRegister) window._validateRegister();
    });

    document.querySelector(".login.nav-item").addEventListener("click", () => {
        document.querySelector(".login.nav-item").classList.add("active");
        document.querySelector(".register-form.form").classList.remove("active-form");
        document.querySelector(".login-form.form").classList.add("active-form");
        document.querySelector(".register.nav-item").classList.remove("active");
        document.querySelector(".active-bar").style.transform = "translateX(94.4px)";

        if (window._validateLogin) window._validateLogin();
    });

    // ---------- 复选框 ----------
    function toggleCheckbox(checkbox) {
        if (!checkbox) return;
        if (checkbox.classList.contains("checked")) {
            checkbox.classList.remove("checked");
        } else {
            checkbox.classList.add("checked");
        }

        checkbox.setAttribute('aria-checked', checkbox.classList.contains('checked') ? 'true' : 'false');

        const isLoginActive = document.querySelector(".login-form.form").classList.contains("active-form");
        if (isLoginActive) {
            if (window._validateLogin) window._validateLogin();
        } else {
            if (window._validateRegister) window._validateRegister();
        }
    }

    // 注册协议复选框（原代码不变，但调用改为了 toggleCheckbox）
    document.querySelector(".regAgreement").addEventListener("click", (e) => {
        if (e.target.tagName === 'A') return; // 忽略链接点击
        const checkbox = document.querySelector(".regAgreement .checkbox");
        toggleCheckbox(checkbox);
    });

    document.querySelector(".loginAgreement").addEventListener("click", (e) => {
        if (e.target.tagName === 'A') return;
        const checkbox = document.querySelector(".loginAgreement .checkbox");
        toggleCheckbox(checkbox);
    });

    // ═══ 修改点 5：为登录和注册表单添加 submit 事件处理 ═══
    const loginForm = document.querySelector(".login-form.form");
    const registerForm = document.querySelector(".register-form.form");


    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
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
            window.parent.postMessage(JSON.stringify({
                action: 'login',
                username: getVal(loginUsername),
                password: getVal(loginPassword)
            }), '*');
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", function (e) {
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
            window.parent.postMessage(JSON.stringify({
                action: 'register',
                username: getVal(regUsername),
                email: getVal(regEmail),
                password: getVal(regPassword)
            }), '*');
        });
    }

    // ---------- 遇到问题 ----------
    document.querySelector(".haveQuestion").addEventListener("click", () => {
        showResult("无法加载");
    });

    // 如果 URL 参数指定 tab=register，则切换到注册
    if (params.get('tab') === 'register') {
        document.querySelector(".register.nav-item").click();
    }
    window.addEventListener("message", async (event) => {

        switch (event.data) {
            case "registerSuccess":
                closeToast();
                showResult("注册成功");
                break;
            case "registerFailure":
                closeToast();
                showResult("注册失败");
                break;
            case "loginSuccess":
                closeToast();
                showResult("登录成功", 'info', 1300);
                setTimeout(() => {
                    window.parent.postMessage(JSON.stringify({ action: "closeWindow" }), "*");
                }, 1300);
                break;
            case "loginFailure":
                closeToast();
                showResult("登录失败");
                break;
            default:
                console.log("不能够处理的消息", event.data);
        }
    });
})();