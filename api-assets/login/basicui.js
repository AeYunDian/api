// ============================================================
//  basicui.js 
//  改动：删除重复的校验代码，改为调用 userinput.js 的校验函数；
//        为登录/注册表单添加 submit 事件；
//        在切换 Tab 和勾选复选框后触发校验。
// ============================================================

// ═══ 使用自执行函数避免污染，但保留原有变量 ═══
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

    let i18nData = null;          // 存储父窗口发来的翻译对象
    const params = new URLSearchParams(window.location.search);

    // ---------- 关闭按钮 ----------
    document.querySelector(".card-close").addEventListener("click", () => {
        window.parent.postMessage(JSON.stringify({ action: "closeWindow" }), "*");
    });
    document.querySelector(".active-bar").style.transform = `translateX(${_t('nav.login.bartf')})`;
    // ---------- Tab 切换 ----------
    document.querySelector(".register.nav-item").addEventListener("click", () => {
        document.querySelector(".login.nav-item").classList.remove("active");
        document.querySelector(".register.nav-item").classList.add("active");
        document.querySelector(".register-form.form").classList.add("active-form");
        document.querySelector(".login-form.form").classList.remove("active-form");
        document.querySelector(".active-bar").style.transform = `translateX(${_t('nav.reg.bartf')})`;

        if (window._validateRegister) window._validateRegister();
    });

    document.querySelector(".login.nav-item").addEventListener("click", () => {
        document.querySelector(".login.nav-item").classList.add("active");
        document.querySelector(".register-form.form").classList.remove("active-form");
        document.querySelector(".login-form.form").classList.add("active-form");
        document.querySelector(".register.nav-item").classList.remove("active");
        document.querySelector(".active-bar").style.transform = `translateX(${_t('nav.login.bartf')})`;

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

    // 注册协议复选框
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
                    AyShowResult(_t(result.msg));

                    return;
                }
            }

            AyShowResult(_t('common.please_wait'), 'loading', 0);
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
                    AyShowResult(_t(result.msg));
                    return;
                }
            }
            AyShowResult(_t('common.please_wait'), 'loading', 0);
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
        const featuresHeight = window.screen.height * (7 / 10)
        const featuresWidth = window.screen.width * (5 / 10)
        const featuresLeft = (window.screen.width - featuresWidth) / 2;
        const featuresTop = (window.screen.height - featuresHeight - 35) / 2;
        // 窗口特性
        const features = [
            `width=${featuresWidth}`,
            `height=${featuresHeight}`,
            `left=${featuresLeft}`,
            `top=${featuresTop}`,
            'resizable=yes',
            'scrollbars=yes',
            'status=no',
            'menubar=no',
            'toolbar=no'
        ].join(',');
        window.open(_t('link.faq'), '_blank', features);
    });

    // 如果 URL 参数指定 tab=register，则切换到注册
    if (params.get('tab') === 'register') {
        document.querySelector(".register.nav-item").click();
    }
    window.addEventListener("message", async (event) => {
        if (event.source !== window.parent) return;
        let data = event.data;
        // 如果是字符串，保持兼容；如果是 JSON 字符串，解析
        if (typeof data === 'string' && data.startsWith('{')) {
            try {
                data = JSON.parse(data);
            } catch { /* 忽略 */ }
        }

        // 处理对象
        if (typeof data === 'object' && data.action) {
            switch (data.action) {
                case 'registerSuccess': AyCloseToast(); AyShowResult(_t('common.register_success')); break;
                case 'registerFailure':
                    AyCloseToast();
                    AyShowResult(data.message || _t('common.register_failure'));
                    break;
                case 'loginSuccess':
                    AyCloseToast();
                    AyShowResult(_t('common.login_success'), 'info', 1000);
                    setTimeout(() => window.parent.postMessage(JSON.stringify({ action: "closeWindow" }), "*"), 1000);
                    break;
                case 'loginFailure':
                    AyCloseToast();
                    AyShowResult(data.message || _t('common.login_failure'));
                    break;
                case 'changeLanguage':
                    if (document.querySelector("form.login-form")?.classList.contains('active-form')) {
                        document.querySelector(".active-bar").style.transform = `translateX(${_t('nav.login.bartf')})`;
                    } else {
                        document.querySelector(".active-bar").style.transform = `translateX(${_t('nav.reg.bartf')})`;
                    }
                    await translatePage().catch((err) => console.warn("Translation error:", err),); break;
                case 'updateTranslations':
                    if (data.payload && typeof data.payload === 'object') {
                        i18nData = data.payload;
                        // 重新翻译页面（可选）
                        translatePage().catch(console.warn);
                    }
                    break;
                default: break;
            }
        } else {
            // 兼容旧版纯字符串消息
            switch (data) {
                case "registerSuccess": AyCloseToast(); AyShowResult(_t('common.register_success')); break;
                case "registerFailure": AyCloseToast(); AyShowResult(_t('common.register_failure')); break;
                case "loginSuccess": AyCloseToast(); AyShowResult(_t('common.login_success'), 'info', 1000); setTimeout(() => window.parent.postMessage(JSON.stringify({ action: "closeWindow" }), "*"), 1000); break;
                case "loginFailure": AyCloseToast(); AyShowResult(_t('common.login_failure')); break;
                case 'changeLanguage': await translatePage().catch((err) => console.warn("Translation error:", err),); break;
                default: break;
            }
        }
    });
})();



function _t(key) {
    if (i18nData && typeof i18nData === 'object' && key in i18nData) {
        return i18nData[key];
    }
    return key; // 未找到则返回原 key
}

async function translatePage(maxRetries = 3) {
    console.log('[AyLoginTranslate] Starting translatePage');
    const elements = document.querySelectorAll('[data-i18n], [data-i18n-placeholder], [data-i18n-href]');
    console.log('[AyLoginTranslate] Found elements count:', elements.length);

    if (elements.length === 0) {
        if (maxRetries <= 0) {
            console.warn('[AyLoginTranslate] No translatable elements found, giving up.');
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        return translatePage(maxRetries - 1);
    }

    // ---------- 分别收集所有 key，去重 ----------
    const keys = new Set();
    elements.forEach(el => {
        const i18nKey = el.getAttribute('data-i18n');
        if (i18nKey) keys.add(i18nKey);
        const placeholderKey = el.getAttribute('data-i18n-placeholder');
        if (placeholderKey) keys.add(placeholderKey);
        const hrefKey = el.getAttribute('data-i18n-href');
        if (hrefKey) keys.add(hrefKey);
    });

    // 翻译所有 key
    const translationMap = {};
    keys.forEach(key => {
        translationMap[key] = _t(key);
    });

    // 更新 DOM
    elements.forEach(el => {
        const i18nKey = el.getAttribute('data-i18n');
        if (i18nKey && translationMap[i18nKey] !== undefined) {
            el.innerHTML = translationMap[i18nKey];
        }

        const placeholderKey = el.getAttribute('data-i18n-placeholder');
        if (placeholderKey && translationMap[placeholderKey] !== undefined) {
            el.placeholder = translationMap[placeholderKey];
        }

        const hrefKey = el.getAttribute('data-i18n-href');
        if (hrefKey && translationMap[hrefKey] !== undefined) {
            el.href = translationMap[hrefKey];
        }
    });
}