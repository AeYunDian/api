// src/sdk.js

// 因为SDK用了Weakmap，所以不能用Pinia

let sdkInstance = null

export function initSdk(appId, i18n = 'zh-cn') {
    if (typeof window === 'undefined' || !window.AyAccount) {
        throw new Error('[SDK] AyAccountSDK not loaded. Please include the script tag first.')
    }
    if (!sdkInstance) {
        sdkInstance = new window.AyAccount({ appId, i18n })
    }
    return sdkInstance
}

export function getSdk() {
    if (!sdkInstance) {
        throw new Error('[SDK] SDK not initialized. Call initSdk() first.')
    }
    return sdkInstance
}