// /login/beta/beta.js —— 测试版登录页的 GitHub 入口
(function () {
    "use strict";

    function showGithubEntry() {
        var wrap = document.getElementById("githubProviderBtn");
        if (wrap) wrap.style.display = "block";

        var btn = document.getElementById("oauthGithubBtn");
        if (!btn || btn.dataset.bound === "1") return;
        btn.dataset.bound = "1";
        btn.addEventListener("click", function (event) {
            event.preventDefault();
            window.parent.postMessage(
                JSON.stringify({
                    action: "oauth_login",
                    provider: "github",
                    beta: true,
                }),
                "*",
            );
        });
    }

    function hideGithubEntry() {
        var wrap = document.getElementById("githubProviderBtn");
        if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
    }

    window.addEventListener("message", function (event) {
        if (event.source !== window.parent) return;
        var data = event.data;
        if (typeof data === "string" && data.charAt(0) === "{") {
            try {
                data = JSON.parse(data);
            } catch (e) {
                return;
            }
        }
        if (!data || data.action !== "configWindow" || !data.config) return;
        if (data.config.hideOauthClient) hideGithubEntry();
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", showGithubEntry);
    } else {
        showGithubEntry();
    }
})();
