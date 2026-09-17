<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { detectCountry, isChina } from '@/shared/utils/ipDetect.js'
import { useRouter } from 'vue-router'

const router = useRouter()

const visible = ref(false)
const country = ref('')
const CONSENT_KEY = 'gov_cookie_consent'

function readConsent() {
    try { return localStorage.getItem(CONSENT_KEY) } catch { return null }
}
function writeConsent(v) {
    try { localStorage.setItem(CONSENT_KEY, v) } catch { }
}

let checking = false
async function checkConsent(path) {
    if (path === '/cookies') {
        visible.value = false
        return
    }
    if (readConsent()) return
    if (checking) return
    checking = true
    try {
        const geo = await detectCountry()
        if (!geo?.country) return
        country.value = geo.country
        if (!isChina(geo.country)) {
            visible.value = true
        }
    } catch (e) {
        visible.value = true
    } finally {
        checking = false
    }
}

onMounted(() => {
    checkConsent(router.currentRoute.value.path)
})

const stop = router.afterEach((to) => {
    checkConsent(to.path)
})
onUnmounted(stop)

function accept() { writeConsent('all'); visible.value = false }
function acceptNecessary() { writeConsent('necessary'); visible.value = false }
</script>

<template>
    <Teleport to="body">
        <div v-if="visible" class="cc-mask" role="dialog" aria-modal="true" aria-label="Cookie 使用授权">
            <div class="cc-dialog">
                <div class="cc-head">
                    <span class="cc-head__icon">
                        <MyIcon icon="cookie" />
                    </span>
                    <h2 class="cc-head__title">我们重视您的隐私</h2>
                </div>
                <div class="cc-body">
                    <p class="cc-msg">
                        我们和我们的第三方供应商使用 Cookie 和类似技术来存储和访问唯一标识符、个人信息等信息，以提供、维护和改进我们的服务与广告。
                        如果您同意，我们将个性化您看到的内容和广告。
                        您可以选择“我接受”以同意这些用途。
                    </p>
                    <p class="cc-detail">
                        您也可以选择“仅同意必要项”，继续使用基础功能。相关说明请查看《Cookie 政策》。
                    </p>
                    <p class="cc-detail">根据您所在地区的法律法规，我们需要征得您的同意。您可以随时在 Cookie 政策页面中更改您的选择。</p>
                    <p class="cc-country" v-if="country">
                        检测到您来自 {{ country }}
                    </p>
                </div>
                <div class="cc-foot">
                    <button class="cc-btn cc-btn--ghost" @click="acceptNecessary">仅同意必要项</button>
                    <button class="cc-btn cc-btn--primary" @click="accept">同意全部</button>
                    <RouterLink class="cc-policy" to="/cookies">《Cookie 政策》</RouterLink>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.cc-mask {
    position: fixed;
    inset: 0;
    z-index: 20000;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    background: rgba(0, 0, 0, .45);
    padding: var(--gov-gap-lg);
}

@media (min-width: 700px) {
    .cc-mask {
        align-items: center;
    }
}

.cc-dialog {
    width: 100%;
    max-width: 560px;
    background: #fff;
    border: 1px solid var(--gov-border-deep);
    box-shadow: 0 8px 32px rgba(0, 0, 0, .3);
}

.cc-head {
    display: flex;
    align-items: center;
    gap: var(--gov-gap-sm);
    padding: var(--gov-gap-md) var(--gov-gap-lg);
    background: var(--gov-blue-deep);
    color: #fff;
    border-bottom: 3px solid var(--gov-nav-gold);
}

.cc-head__icon {
    font-size: 20px;
}

.cc-head__title {
    font-family: var(--gov-font-title);
    font-size: var(--gov-fs-lg);
    font-weight: 700;
    letter-spacing: 1px;
}

.cc-body {
    padding: var(--gov-gap-lg);
}

.cc-msg {
    font-size: var(--gov-fs-base);
    line-height: 1.9;
    color: var(--gov-text);
    margin-bottom: var(--gov-gap-sm);
}

.cc-detail {
    font-size: var(--gov-fs-sm);
    line-height: 1.8;
    color: var(--gov-text-sub);
    margin-bottom: var(--gov-gap-sm);
}

.cc-country {
    font-size: var(--gov-fs-xs);
    color: var(--gov-text-muted);
}

.cc-foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--gov-gap-md);
    padding: var(--gov-gap-md) var(--gov-gap-lg);
    border-top: 1px solid var(--gov-border);
    background: var(--gov-bg-gray);
}

.cc-btn {
    height: 34px;
    padding: 0 var(--gov-gap-xl);
    font-size: var(--gov-fs-base);
    letter-spacing: 1px;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all .15s;
}

.cc-btn--primary {
    background: var(--gov-btn-primary);
    border-color: var(--gov-btn-primary-border);
    color: #fff;
    font-weight: bold;
}

.cc-btn--primary:hover {
    background: var(--gov-btn-primary-hover);
}

.cc-btn--ghost {
    background: #fff;
    border-color: var(--gov-border-dark);
    color: var(--gov-text);
}

.cc-btn--ghost:hover {
    border-color: var(--gov-blue);
    color: var(--gov-blue);
}

.cc-policy {
    font-size: var(--gov-fs-sm);
    color: var(--gov-blue);
    margin-left: auto;
}

.cc-policy:hover {
    text-decoration: underline;
}
</style>