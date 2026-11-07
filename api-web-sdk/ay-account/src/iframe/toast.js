import { dom } from "./dom.js";
import { $ } from "./utils.js";

class Toast {
    constructor(root) {
        this.root = root;
        this.text = $(".ay-toast__text", root);
        this.loadingIcon = $(".ay-icon__image--loading", root);
        this.errorIcon = $(".ay-icon__image--error", root);
        this.timer = null;
    }

    show(message, type = "info", timeout = 1400) {
        if (!this.root || !this.text) return;
        this.text.textContent = message == null ? "" : String(message);
        if (this.loadingIcon) {
            this.loadingIcon.style.display =
                type === "loading" ? "block" : "none";
        }
        if (this.errorIcon) {
            this.errorIcon.style.display = type === "error" ? "block" : "none";
        }
        this.root.style.display = "flex";
        this.clearTimer();
        if (timeout > 0) {
            this.timer = setTimeout(() => this.hide(), timeout);
        }
    }

    loading(message) {
        this.show(message, "loading", 0);
    }

    success(message) {
        this.show(message, "info", 1400);
    }

    error(message) {
        this.show(message, "error", 2200);
    }

    hide() {
        if (this.root) this.root.style.display = "none";
        this.clearTimer();
    }

    clearTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}

export const toast = new Toast(dom.toast);
