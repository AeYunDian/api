// ============================================================
//  basicui.js 
//  改动：删除重复的校验代码，改为调用 userinput.js 的校验函数；
//        为登录/注册表单添加 submit 事件；
//        在切换 Tab 和勾选复选框后触发校验。
// ============================================================
let i18nData = null;          // 存储父窗口发来的翻译对象
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
    const regEmailCode = $('#regEmailCode');
    const regGetEmailCode = $('.getEmailCode');
    const regPassword = $('#regPassword');
    const regPasswordConfirm = $('#regPasswordConfirm');
    const regAgreement = $('.regAgreement .checkbox');
    const regBtn = $('.regBtn');

    var IsDisabledOperation = false;
    var emailCodeToken = null;
    const params = new URLSearchParams(window.location.search);
    function disableOperation() {
        IsDisabledOperation = true;
        regUsername.disabled = true;
        regEmail.disabled = true;
        regPassword.disabled = true;
        regPasswordConfirm.disabled = true;
        regAgreement.disabled = true;
        regBtn.disabled = true;
        loginUsername.disabled = true;
        loginPassword.disabled = true;
        loginAgreement.disabled = true;
        loginBtn.disabled = true;
        document.querySelector(".card-close").classList.add("disabled");
    }
    function enableOperation() {
        IsDisabledOperation = false;
        regUsername.disabled = false;
        regEmail.disabled = false;
        regPassword.disabled = false;
        regPasswordConfirm.disabled = false;
        regAgreement.disabled = false;
        regBtn.disabled = false;
        loginUsername.disabled = false;
        loginPassword.disabled = false;
        loginAgreement.disabled = false;
        loginBtn.disabled = false;
        document.querySelector(".card-close").classList.remove("disabled");
    }
    // ---------- 关闭按钮 ----------
    document.querySelector(".card-close").addEventListener("click", () => {
        if (IsDisabledOperation) return;
        window.parent.postMessage(JSON.stringify({ action: "closeWindow" }), "*");
    });
    document.querySelector(".active-bar").style.transform = `translateX(${_t('nav.login.bartf')})`;
    // ---------- Tab 切换 ----------
    document.querySelector(".register.nav-item").addEventListener("click", () => {
        if (IsDisabledOperation) return;
        document.querySelector(".login.nav-item").classList.remove("active");
        document.querySelector(".register.nav-item").classList.add("active");
        document.querySelector(".register-form.form").classList.add("active-form");
        document.querySelector(".login-form.form").classList.remove("active-form");
        document.querySelector(".active-bar").style.transform = `translateX(${_t('nav.reg.bartf')})`;
        if (window._validateRegister) window._validateRegister();
    });

    document.querySelector(".login.nav-item").addEventListener("click", () => {
        if (IsDisabledOperation) return;
        document.querySelector(".login.nav-item").classList.add("active");
        document.querySelector(".register-form.form").classList.remove("active-form");
        document.querySelector(".login-form.form").classList.add("active-form");
        document.querySelector(".register.nav-item").classList.remove("active");
        document.querySelector(".active-bar").style.transform = `translateX(${_t('nav.login.bartf')})`;
        if (window._validateLogin) window._validateLogin();
    });

    // ---------- 复选框 ----------
    function toggleCheckbox(checkbox) {
        if (IsDisabledOperation) return;
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
        if (IsDisabledOperation) return;
        if (e.target.tagName === 'A') return;
        const checkbox = document.querySelector(".regAgreement .checkbox");
        toggleCheckbox(checkbox);
    });

    document.querySelector(".loginAgreement").addEventListener("click", (e) => {
        if (IsDisabledOperation) return;
        if (e.target.tagName === 'A') return;
        const checkbox = document.querySelector(".loginAgreement .checkbox");
        toggleCheckbox(checkbox);
    });

    const loginForm = document.querySelector(".login-form.form");
    const registerForm = document.querySelector(".register-form.form");

    if (regGetEmailCode) {
        regGetEmailCode.addEventListener("click", function (e) {
            e.preventDefault();
            disableOperation();
            AyShowResult(_t('common.please_wait'), 'loading', 0);
            window.parent.postMessage(JSON.stringify({
                action: 'sendEmailCode',
                email: regEmail.value,

            }), '*');
        });
    }
    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            if (IsDisabledOperation) return;
            // 如果校验不通过，校验处会提示哪里有问题
            if (window._validateLogin) {
                const result = window._validateLogin();
                if (!result.valid) {
                    loginBtn.blur();
                    AyShowResult(_t(result.msg));
                    return;
                }
            }
            disableOperation()
            AyShowResult(_t('common.please_wait'), 'loading', 0);
            window.parent.postMessage(JSON.stringify({
                action: 'login',
                username: getVal(loginUsername),
                password: getVal(loginPassword),

            }), '*');
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", function (e) {
            e.preventDefault();
            if (IsDisabledOperation) return;
            // 调用校验，并获取详细错误信息
            if (window._validateRegister) {
                const result = window._validateRegister();
                if (!result.valid) {
                    regBtn.blur();
                    AyShowResult(_t(result.msg));
                    return;
                }
            }
            disableOperation()
            AyShowResult(_t('common.please_wait'), 'loading', 0);
            window.parent.postMessage(JSON.stringify({
                action: 'register',
                username: getVal(regUsername),
                email: getVal(regEmail),
                password: getVal(regPassword),
                code: getVal(regEmailCode),
                token: emailCodeToken,
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

    window.addEventListener("message", async (event) => {
        if (event.source !== window.parent) return;
        let data = event.data;
        if (typeof data === 'string' && data.startsWith('{')) {
            try {
                data = JSON.parse(data);
            } catch { }
        }

        if (typeof data === 'object' && data.action) {
            switch (data.action) {
                case 'sendEmailCodeSuccess':
                    emailCodeToken = data.token;
                    AyCloseToast();
                    enableOperation();
                    AyShowResult(_t('common.send_email_code_success'));
                    regGetEmailCode.disabled = true;
                    regGetEmailCode.innerText = "重试"
                    setTimeout(() => { regGetEmailCode.disabled = false; }, 60 * 1000)
                    break;
                case 'sendEmailCodeFailure':
                    AyCloseToast();
                    enableOperation();
                    AyShowResult(data.message || _t('common.send_email_code_failure'));
                    regGetEmailCode.disabled = false;
                    regGetEmailCode.innerText = "重试"
                    break;
                case 'registerSuccess':
                    AyCloseToast();
                    AyShowResult(_t('common.register_success'));
                    if (params.get('tab') !== 'register') enableOperation();
                    if (params.get('tab') === 'register') setTimeout(() => window.parent.postMessage(JSON.stringify({ action: "closeWindow" }), "*"), 1000);
                    break;
                case 'registerFailure':
                    enableOperation();
                    AyCloseToast();
                    AyShowResult(data.message || _t('common.register_failure'));
                    regGetEmailCode.disabled = false;
                    break;
                case 'loginSuccess':
                    AyCloseToast();
                    if (params.get('tab') !== 'login') enableOperation();
                    AyShowResult(_t('common.login_success'), 'info', 1000);
                    if (params.get('tab') === 'login') setTimeout(() => window.parent.postMessage(JSON.stringify({ action: "closeWindow" }), "*"), 1000);
                    break;
                case 'loginFailure':
                    enableOperation();
                    AyCloseToast();
                    AyShowResult(data.message || _t('common.login_failure'), 'info', 1000);
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
                        if (document.querySelector("form.login-form")?.classList.contains('active-form')) {
                            document.querySelector(".active-bar").style.transform = `translateX(${_t('nav.login.bartf')})`;
                        } else {
                            document.querySelector(".active-bar").style.transform = `translateX(${_t('nav.reg.bartf')})`;
                        }
                        translatePage().catch(console.warn);

                    }
                    break;
                case 'beforeClose':
                    document.querySelector("div.app")?.classList.remove("show");
                    break;
                default: break;
            }
        }
    });
    // 如果 URL 参数指定 tab=register，则切换到注册
    if (params.get('tab') === 'register') {
        document.querySelector(".register.nav-item").click();
    }
})();


function _t(key) {
    if (i18nData && typeof i18nData === 'object' && key in i18nData) {
        return i18nData[key];
    }
    return key; // 未找到则返回原 key
}

async function translatePage(maxRetries = 3) {
    const elements = document.querySelectorAll('[data-i18n], [data-i18n-placeholder], [data-i18n-href]');

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