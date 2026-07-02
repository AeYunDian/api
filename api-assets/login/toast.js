function AyShowResult(data, type = "info", timeout = 1100) {
    var toast = document.querySelector(".ay-popup.ay-toast");
    var text = document.querySelector(".ay-toast__text");
    var errorIcon = document.querySelector(".ay-icon__image--error");
    var loadingIcon = document.querySelector(".ay-icon__image--loading");

    if (!toast || !text) return;

    // 处理消息内容
    var msg = data;
    if (data instanceof Error) msg = data.message || data.toString();
    else if (typeof data === "object") msg = JSON.stringify(data, null, 2);
    text.textContent = msg;

    // 切换图标
    if (type === "error") {
        errorIcon.style.display = "block";
        loadingIcon.style.display = "none";
    } else if (type === "loading") {
        errorIcon.style.display = "none";
        loadingIcon.style.display = "block";
    } else {
        errorIcon.style.display = "none";
        loadingIcon.style.display = "none";
    }

    // 显示 Toast
    toast.style.display = "flex";

    // 清除之前的自动关闭定时器
    if (window._toastTimer) {
        clearTimeout(window._toastTimer);
        window._toastTimer = null;
    }

    // 如果 timeout > 0，设置自动关闭；若为 0 则不自动关闭
    if (timeout > 0) {
        window._toastTimer = setTimeout(function () {
            toast.style.display = "none";
        }, timeout);
    }
}

// 手动关闭 Toast 的方法
function AyCloseToast() {
    var toast = document.querySelector(".ay-popup.ay-toast");
    if (toast) toast.style.display = "none";
    if (window._toastTimer) {
        clearTimeout(window._toastTimer);
        window._toastTimer = null;
    }
}

window.addEventListener("load", function () {
    var toast = document.querySelector(".ay-popup.ay-toast");
    if (toast) {
        toast.style.display = "none";
    }
});