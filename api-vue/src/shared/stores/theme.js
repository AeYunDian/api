// src/shared/stores/theme.js
import { defineStore } from "pinia";
import { StyleProvider, Themes } from "@varlet/ui";

// 皮肤 × 明暗 → Varlet 主题对象
const THEME_MAP = {
  md3: {
    light: Themes.md3Light,
    dark: Themes.md3Dark,
  },
  md2: {
    light: Themes.md2Light,
    dark: Themes.md2Dark,
  },
};

const SKINS = ["md3", "md2"];
const MODES = ["light", "dark"];
const DEFAULT_SKIN = "md3";
const DEFAULT_MODE = "light";

const STORAGE_KEY_THEME = "theme";
const STORAGE_KEY_SKIN = "skin";

// ──────────────── localStorage 工具 ────────────────

function readStored(key, allowed, fallback) {
  try {
    const v = localStorage.getItem(key);
    return allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function hasStored(key) {
  try {
    return localStorage.getItem(key) != null;
  } catch {
    return false;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* 隐私模式 / 配额超限，忽略 */
  }
}

// ──────────────── 模块级 storage handler ────────────────
// 保证同一进程只有一个监听器；HMR 时会重建模块，开发场景可接受。
let storageHandler = null;

export const useThemeStore = defineStore("theme", {
  state: () => ({
    // 明暗：'light' | 'dark'（沿用旧键名，向后兼容）
    currentTheme: readStored(STORAGE_KEY_THEME, MODES, DEFAULT_MODE),
    // 皮肤：'md3' | 'md2'
    currentSkin: readStored(STORAGE_KEY_SKIN, SKINS, DEFAULT_SKIN),
  }),

  getters: {
    isDark: (state) => state.currentTheme === "dark",
    isMd2: (state) => state.currentSkin === "md2",
    varletTheme: (state) => THEME_MAP[state.currentSkin][state.currentTheme],
  },

  actions: {
    /**
     * 切换明暗（用户操作入口，写 localStorage）
     * @param {'light' | 'dark'} mode
     */
    setTheme(mode) {
      if (!MODES.includes(mode)) {
        console.error(`Unknown theme: ${mode}`);
        return;
      }
      this.currentTheme = mode;
      safeSet(STORAGE_KEY_THEME, mode);
      this.applyTheme();
    },

    /**
     * 切换皮肤（用户操作入口，写 localStorage）
     * @param {'md3' | 'md2'} skin
     */
    setSkin(skin) {
      if (!SKINS.includes(skin)) {
        console.error(`Unknown skin: ${skin}`);
        return;
      }
      this.currentSkin = skin;
      safeSet(STORAGE_KEY_SKIN, skin);
      this.applyTheme();
    },

    /**
     * 同时切换皮肤和明暗（避免两次 applyTheme）
     * @param {{ skin?: 'md3' | 'md2', mode?: 'light' | 'dark' }} opts
     */
    setThemeAndSkin({ skin, mode } = {}) {
      let changed = false;

      if (skin != null) {
        if (SKINS.includes(skin)) {
          this.currentSkin = skin;
          safeSet(STORAGE_KEY_SKIN, skin);
          changed = true;
        } else {
          console.warn(`Invalid skin "${skin}", ignored`);
        }
      }

      if (mode != null) {
        if (MODES.includes(mode)) {
          this.currentTheme = mode;
          safeSet(STORAGE_KEY_THEME, mode);
          changed = true;
        } else {
          console.warn(`Invalid mode "${mode}", ignored`);
        }
      }

      if (changed) this.applyTheme();
    },

    /**
     * 应用「应用级默认皮肤」，仅当用户还没选过时生效
     * 不写 localStorage，保留"未选择"状态
     * @param {'md3' | 'md2'} skin
     */
    applyDefaultSkin(skin) {
      if (!SKINS.includes(skin)) {
        console.warn(`Invalid default skin "${skin}"`);
        return;
      }
      if (hasStored(STORAGE_KEY_SKIN)) return; // 用户已选过，尊重用户
      if (this.currentSkin === skin) return; // 已是该值，无需重复 apply
      this.currentSkin = skin;
      this.applyTheme();
    },

    /**
     * 从 storage 事件同步（内部使用，不写 localStorage）
     * @param {string} key
     * @param {string|null} value
     */
    _syncFromStorage(key, value) {
      if (value == null) return;

      if (key === STORAGE_KEY_THEME) {
        if (!MODES.includes(value)) return;
        if (this.currentTheme === value) return;
        this.currentTheme = value;
      } else if (key === STORAGE_KEY_SKIN) {
        if (!SKINS.includes(value)) return;
        if (this.currentSkin === value) return;
        this.currentSkin = value;
      } else {
        return;
      }

      this.applyTheme();
    },

    /**
     * 注册跨标签页 / 跨窗口 storage 同步（幂等）
     *
     * 说明：
     * - storage 事件只在「其他同源文档」触发，当前文档的 setItem 不会触发自己，
     *   因此 _syncFromStorage 不写 localStorage 时不会形成回环。
     * - 每个标签页独立注册自己的监听。
     */
    initStorageSync() {
      if (storageHandler) return;

      storageHandler = (e) => {
        // 过滤非 localStorage（理论上不会，但保险）
        if (e.storageArea && e.storageArea !== localStorage) return;

        // e.key === null 表示 localStorage.clear()，这里选择忽略
        // 如果希望 clear() 时恢复默认主题，可在此处理
        if (e.key === null) return;

        this._syncFromStorage(e.key, e.newValue);
      };

      window.addEventListener("storage", storageHandler);
    },

    /**
     * 注销 storage 监听（SPA 一般不需要，微前端卸载 / 测试用）
     */
    destroyStorageSync() {
      if (!storageHandler) return;
      window.removeEventListener("storage", storageHandler);
      storageHandler = null;
    },

    /**
     * 应用当前皮肤 + 明暗到 DOM 和 Varlet
     */
    applyTheme() {
      let mode = this.currentTheme;
      let skin = this.currentSkin;

      if (!MODES.includes(mode)) {
        console.warn(`Invalid theme "${mode}", fallback to "${DEFAULT_MODE}"`);
        mode = DEFAULT_MODE;
        this.currentTheme = mode;
        safeSet(STORAGE_KEY_THEME, mode);
      }
      if (!SKINS.includes(skin)) {
        console.warn(`Invalid skin "${skin}", fallback to "${DEFAULT_SKIN}"`);
        skin = DEFAULT_SKIN;
        this.currentSkin = skin;
        safeSet(STORAGE_KEY_SKIN, skin);
      }

      const root = document.documentElement;
      root.classList.toggle("dark", mode === "dark");
      root.classList.toggle("md2", skin === "md2");

      StyleProvider(THEME_MAP[skin][mode]);
    },

    /**
     * 初始化主题（App 挂载时调用一次）
     *
     * @param {'md3' | 'md2'} [defaultSkin] - 若用户从未选过皮肤，则应用此默认值
     *
     * 会同时：
     *   1. 若用户未选择皮肤，应用 defaultSkin（不写 localStorage）
     *   2. 应用当前 state 到 DOM + Varlet
     *   3. 注册 storage 跨标签页同步（幂等）
     */
    initializeTheme(defaultSkin) {
      if (
        defaultSkin &&
        SKINS.includes(defaultSkin) &&
        !hasStored(STORAGE_KEY_SKIN)
      ) {
        this.currentSkin = defaultSkin;
      }
      this.applyTheme();
      this.initStorageSync();
    },
  },
});
