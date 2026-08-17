// ============================================================
//  userinput.js  -  表单校验与按钮状态控制
//  依赖：无（纯 DOM 操作）
//  功能：实时校验登录/注册表单
//  暴露：window._validateLogin, window._validateRegister
// ============================================================

(function () {
    'use strict';

    // ---------- DOM 引用 ----------
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const getVal = (el) => el ? el.value.trim() : '';

    const loginUsername = $('#loginUsernameOrEmail');
    const loginPassword = $('#loginPassword');
    const loginAgreement = $('.loginAgreement .checkbox');
    const loginBtn = $('.loginBtn');

    const regUsername = $('#regUsername');
    const regEmail = $('#regEmail');
    const regEmailCode = $('#regEmailCode');
    const regPassword = $('#regPassword');
    const regPasswordConfirm = $('#regPasswordConfirm');
    const regAgreement = $('.regAgreement .checkbox');
    const regBtn = $('.regBtn');

    // ---------- 工具函数 ----------
    function isNonEmpty(str) {
        return str && str.trim().length > 0;
    }

    function isValidEmail(str) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
    }

    // ---------- 校验函数（全局暴露） ----------
    window._validateLogin = function () {
        if (!loginBtn) return false;
        const username = getVal(loginUsername);
        const password = getVal(loginPassword);
        const agreed = loginAgreement ? loginAgreement.classList.contains('checked') : false;
        let valid = true;
        let msg = '';

        if (!isNonEmpty(username)) {
            valid = false;
            msg = 'common.enter_username_or_email';
        } else if (!isNonEmpty(password)) {
            valid = false;
            msg = 'common.enter_password';
        } else if (password.length < 6) {
            valid = false;
            msg = 'common.password_min_length';
        } else if (!agreed) {
            valid = false;
            msg = 'common.please_read_and_agree';
        }

        return { valid, msg };
    };

    window._validateRegister = function () {
        if (!regBtn) return { valid: false, msg: '' };
        const username = getVal(regUsername);
        const email = getVal(regEmail);
        const password = getVal(regPassword);
        const confirm = getVal(regPasswordConfirm);
        const agreed = regAgreement ? regAgreement.classList.contains('checked') : false;

        let valid = true;
        let msg = '';

        if (!isNonEmpty(username)) {
            valid = false;
            msg = 'common.enter_username';
        } else if (!isNonEmpty(email)) {
            valid = false;
            msg = 'common.enter_email';
        } else if (!isValidEmail(email)) {
            valid = false;
            msg = 'common.invalid_email_format';
        } else if (getVal(regEmailCode).length != 6) {
            valid = false;
            msg = 'common.reg_email_code_length';
        } else if (!isNonEmpty(password)) {
            valid = false;
            msg = 'common.enter_password';
        } else if (password.length < 6) {
            valid = false;
            msg = 'common.password_min_length';
        } else if (password !== confirm) {
            valid = false;
            msg = 'common.password_mismatch';
        } else if (!agreed) {
            valid = false;
            msg = 'common.please_read_and_agree';
        }

        return { valid, msg };
    };

    // ---------- 绑定输入事件 ----------
    function bindEvents() {
        if (loginUsername) {
            loginUsername.addEventListener('input', window._validateLogin);
            loginUsername.addEventListener('change', window._validateLogin);
        }
        if (loginPassword) {
            loginPassword.addEventListener('input', window._validateLogin);
            loginPassword.addEventListener('change', window._validateLogin);
        }

        if (regUsername) {
            regUsername.addEventListener('input', window._validateRegister);
            regUsername.addEventListener('change', window._validateRegister);
        }
        if (regEmail) {
            regEmail.addEventListener('input', window._validateRegister);
            regEmail.addEventListener('change', window._validateRegister);
        }
        if (regPassword) {
            regPassword.addEventListener('input', window._validateRegister);
            regPassword.addEventListener('change', window._validateRegister);
        }
        if (regPasswordConfirm) {
            regPasswordConfirm.addEventListener('input', window._validateRegister);
            regPasswordConfirm.addEventListener('change', window._validateRegister);
        }
    }

    // ---------- 初始化 ----------
    function init() {
        bindEvents();
        // 初始校验（默认登录）
        window._validateLogin();
        window._validateRegister();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();