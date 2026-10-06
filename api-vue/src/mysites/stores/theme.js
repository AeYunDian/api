import { defineStore } from 'pinia'
import { StyleProvider, Themes } from '@varlet/ui'

const THEME_MAP = {
    light: Themes.md3Light,
    dark: Themes.md3Dark,
}

export const useThemeStore = defineStore('theme', {
    state: () => ({
        currentTheme: localStorage.getItem('theme') || 'light',
    }),
    actions: {
        /**
         * 切换主题
         * @param {string} themeName - 'light' 或 'dark'
         */
        setTheme(themeName) {
            if (!THEME_MAP[themeName]) {
                console.error(`Unknown theme: ${themeName}`)
                return
            }
            this.currentTheme = themeName
            localStorage.setItem('theme', themeName)
            this.applyTheme()
        },

        /**
         * 应用主题（若未传参则使用 currentTheme）
         * 自动处理 body class 和 StyleProvider，并修正无效主题
         * @param {string} [themeName] - 可选，指定主题名
         */
        applyTheme(themeName) {
            let name = themeName ?? this.currentTheme

            // 校验并回退到 light
            if (!THEME_MAP[name]) {
                console.warn(`Invalid theme "${name}", fallback to "light"`)
                name = 'light'
                this.currentTheme = name
                localStorage.setItem('theme', name)
            }

            // 更新 body class
            if (name === 'dark') {
                document.documentElement.classList.add('dark')
            } else {
                document.documentElement.classList.remove('dark')
            }

            // 调用 Varlet 样式提供器
            StyleProvider(THEME_MAP[name])
        },

        /**
         * 初始化主题（通常在 App 挂载时调用）
         * 直接应用当前 state 中的主题，并自动修正无效值
         */
        initializeTheme() {
            this.applyTheme(this.currentTheme)
        },
    },
})