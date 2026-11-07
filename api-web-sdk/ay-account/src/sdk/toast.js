import { assetUrl } from "./utils.js";
const TOAST_CSS = `
    :host { all: initial; }
    .ay-toast-layer {
      position: fixed;
      inset-block-start: 50%;
      inset-inline: 0;
      display: flex;
      justify-content: center;
      z-index: 1;
      pointer-events: none;
      font-family: "Roboto", "Noto Sans SC", "PingFang SC",
        "Microsoft YaHei", system-ui, -apple-system, "Segoe UI", sans-serif;
    }
    .ay-popup.ay-toast {
      max-height: 100%;
      padding: 12px 20px;
      width: fit-content;
      min-width: 130px;
      max-width: 80%;
      box-sizing: border-box;
      display: none;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      font-size: 14px;
      line-height: 1.6;
      text-align: center;
      border-radius: 8px;
      word-break: break-word;
      white-space: normal;
    }
    .ay-popup.ay-toast.is-visible { display: flex; }
    i.ay-icon { position: relative; display: inline-block; }
    .ay-icon__image {
      width: 20px;
      height: 20px;
      margin-inline-end: 4px;
      vertical-align: middle;
      overflow: clip;
      overflow-clip-margin: content-box;
    }
    .ay-icon__image--loading { animation: ay-toast-spin 2s linear infinite; }
    .ay-icon__image--error { filter: invert(1); display: none; }
    .ay-toast__text { margin-block-start: 0; }
    @keyframes ay-toast-spin { to { transform: rotate(1turn); } }
  `;

function toastMarkup() {
    return `
      <div class="ay-toast-layer">
        <div role="dialog" tabindex="0" class="ay-popup ay-toast" aria-live="polite">
          <i class="ay-icon">
            <img class="ay-icon__image ay-icon__image--loading" alt=""
              src="${assetUrl("toast-loading.svg")}" />
          </i>
          <i class="ay-icon">
            <img class="ay-icon__image ay-icon__image--error" alt=""
              src="${assetUrl("toast-error.svg")}" />
          </i>
          <div class="ay-toast__text">Loading...</div>
        </div>
      </div>
    `;
}
export class AyToast {
    constructor() {
        this.host = null;
        this.root = null;
        this.text = null;
        this.loadingIcon = null;
        this.errorIcon = null;
        this.timer = null;
    }

    ensure() {
        if (this.host) return;
        const host = document.createElement("div");
        host.setAttribute("data-ay-account-toast", "");
        host.style.position = "fixed";
        host.style.inset = "0";
        host.style.zIndex = "20000001";
        host.style.pointerEvents = "none";
        const root = host.attachShadow({ mode: "open" });
        root.innerHTML = `<style>${TOAST_CSS}</style>${toastMarkup()}`;
        document.body.appendChild(host);
        this.host = host;
        this.root = root.querySelector(".ay-popup.ay-toast");
        this.text = root.querySelector(".ay-toast__text");
        this.loadingIcon = root.querySelector(".ay-icon__image--loading");
        this.errorIcon = root.querySelector(".ay-icon__image--error");
    }

    show(message, type = "info", timeout = 1400) {
        this.ensure();
        if (!this.root || !this.text) return;
        this.text.textContent = message == null ? "" : String(message);
        if (this.loadingIcon) {
            this.loadingIcon.style.display =
                type === "loading" ? "block" : "none";
        }
        if (this.errorIcon) {
            this.errorIcon.style.display = type === "error" ? "block" : "none";
        }
        this.root.classList.add("is-visible");
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
        if (this.root) this.root.classList.remove("is-visible");
        this.clearTimer();
    }

    clearTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}
