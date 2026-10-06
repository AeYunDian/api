<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { Dialog, Snackbar } from '@varlet/ui'
import {
    getSites,
    registerSite,
    deleteSite,
    getUsers,
    transferSiteOwner,
} from '@/console/utils/api'
import { formatTime } from '@/shared/utils/format'
import { useIsAdmin } from '@/console/composables/useIsAdmin'
import '@varlet/ui/es/dialog/style'
import '@varlet/ui/es/snackbar/style'

// ── 上下文 ──
const user = inject('user')
const isAdmin = useIsAdmin()

// ── 常量 ──
// 普通用户最多可注册的站点数；user.sub === 1 不受限
const MY_SITE_LIMIT = 5

// 概览站点（独立的 SPA，不在本组件内渲染）
const MYSITES_BASE = import.meta.env.PROD
    ? 'https://mysites.undz.cn'
    : 'https://mysites-dev.undz.cn'

// ── 响应式状态 ──
const loading = ref(false)
const refreshState = ref(false)
const sites = ref([])
const users = ref([])

const showRegisterDialog = ref(false)
const showTransferDialog = ref(false)
const showSnippetDialog = ref(false)
const snippetSite = ref(null)

const emptyRegisterForm = () => ({ domain: '', name: '' })
const emptyTransferForm = () => ({ siteId: '', targetUserId: 1 })

const registerForm = ref(emptyRegisterForm())
const transferForm = ref(emptyTransferForm())

// 普通用户达到上限时禁用注册入口。管理员始终不受限。
// 普通用户看到列表即为自己所有；管理员看到全量，故此处只对非管理员判长。
const limitReached = computed(
    () => !isAdmin.value && sites.value.length >= MY_SITE_LIMIT
)

// ── 嵌入代码 ──
// 两种写法任选其一；同时出现则必须一致，否则跟踪脚本拒绝上报
const snippetQuery = computed(() => {
    if (!snippetSite.value) return ''
    return (
        '<script defer src="' +
        MYSITES_BASE +
        '/analytics.js?token=' +
        snippetSite.value.token +
        '"><\/script>'
    )
})

const snippetDataAttr = computed(() => {
    if (!snippetSite.value) return ''
    return (
        '<script defer src="' +
        MYSITES_BASE +
        '/analytics.js" data-token="' +
        snippetSite.value.token +
        '"><\/script>'
    )
})

// ── 数据加载 ──
async function loadSites() {
    loading.value = true
    try {
        const data = await getSites()
        sites.value = data.sites || []
    } catch (error) {
        Snackbar.error(error.message || '获取站点列表失败')
    } finally {
        loading.value = false
    }
}

async function loadUsers() {
    if (!isAdmin.value) return
    try {
        const data = await getUsers()
        users.value = data.users || []
    } catch (error) {
        Snackbar.error(error.message || '获取用户列表失败')
    }
}

async function refreshAll() {
    await loadSites()
    if (isAdmin.value) await loadUsers()
}

async function onPullRefresh() {
    try {
        await refreshAll()
    } catch (error) {
        Snackbar.error(error.message || '刷新失败')
    } finally {
        refreshState.value = false
    }
}

// ── 注册 ──
async function handleRegister() {
    const form = registerForm.value
    const domain = form.domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (!domain) {
        Snackbar.warning('请填写站点域名')
        return
    }

    try {
        const result = await registerSite({
            domain,
            name: form.name.trim() || domain,
        })
        Snackbar.success('站点注册成功')
        showRegisterDialog.value = false
        registerForm.value = emptyRegisterForm()

        // 顺手把嵌入代码推到用户面前
        if (result.site) {
            snippetSite.value = result.site
            showSnippetDialog.value = true
        }
        await loadSites()
    } catch (error) {
        Snackbar.error(error.message || '注册失败')
    }
}

// ── 删除 ──
async function handleDelete(site) {
    const action = await Dialog({
        title: '确认删除',
        message:
            `确定要删除站点 "${site.name}"（${site.domain}）吗？\n\n` +
            `该站点的全部统计数据将被一并清除，且不可恢复。`,
        dialogStyle: { whiteSpace: 'pre-line' },
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
    })
    if (action !== 'confirm') return

    try {
        await deleteSite(site.id)
        Snackbar.success('站点已删除')
        await loadSites()
    } catch (error) {
        Snackbar.error(error.message || '删除失败')
    }
}

// ── 转移 ──
async function handleTransfer() {
    const form = transferForm.value
    if (!form.siteId || !form.targetUserId) {
        Snackbar.warning('请选择站点和目标用户')
        return
    }
    if (!users.value.some((u) => u.sub === form.targetUserId)) {
        Snackbar.error('目标用户不存在')
        return
    }
    try {
        await transferSiteOwner(form.siteId, form.targetUserId)
        Snackbar.success('转移成功')
        showTransferDialog.value = false
        transferForm.value = emptyTransferForm()
        await loadSites()
    } catch (error) {
        Snackbar.error(error.message || '转移失败')
    }
}

// ── 对话框开关 ──
function openTransferDialog(siteId) {
    transferForm.value.siteId = siteId
    showTransferDialog.value = true
}

function openSnippet(site) {
    snippetSite.value = site
    showSnippetDialog.value = true
}

function resetForms() {
    registerForm.value = emptyRegisterForm()
    transferForm.value = emptyTransferForm()
}

// ── 跳转概览 ──
// 实际数据视图在 mysites.undz.cn，这里只是把用户送过去
function openOverview(site) {
    window.open(`${MYSITES_BASE}/sites/${site.id}`, '_blank', 'noopener')
}

// ── 复制 ──
function copyText(text) {
    try {
        navigator.clipboard?.writeText(text)
        Snackbar.success('已复制到剪贴板')
    } catch {
        Snackbar.error('复制失败，请手动选择')
    }
}

function copySnippet() {
    copyText(snippetQuery.value)
}

// ── 初始化 ──
onMounted(() => {
    loadSites()
    if (isAdmin.value) loadUsers()
})
</script>

<template>
    <var-pull-refresh v-model="refreshState" @refresh="onPullRefresh">
        <div>
            <div class="page-header">
                <h2>网站分析</h2>

                <div class="header-actions">
                    <var-button @click="refreshAll" class="refresh-btn">刷新</var-button>

                    <var-tooltip v-if="limitReached" :content="`每个账号最多注册 ${MY_SITE_LIMIT} 个站点`">
                        <var-button type="primary" disabled>注册新站点</var-button>
                    </var-tooltip>
                    <var-button v-else type="primary" @click="showRegisterDialog = true" :disabled="!user">
                        注册新站点
                    </var-button>
                </div>
            </div>

            <p v-if="sites.length" class="site-count">
                <span v-if="isAdmin">共 {{ sites.length }} 个站点（管理员视图）</span>
                <span v-else>已注册 {{ sites.length }} / {{ MY_SITE_LIMIT }} 个站点</span>
            </p>

            <var-progress v-if="loading" indeterminate />

            <p v-else-if="!sites.length" class="empty-tip">
                暂无站点，点击右上角注册你的第一个站点
            </p>

            <var-list v-else>
                <var-card v-for="site in sites" :key="site.id" class="site-card var-elevation--2">
                    <div>
                        <div class="site-name-row">
                            <strong class="site-name">{{ site.name }}</strong>
                            <var-chip size="small">{{ site.domain }}</var-chip>
                        </div>

                        <div class="site-meta">
                            <div>
                                Token：
                                <span class="copyable" @click="copyText(site.token)">
                                    {{ site.token }}
                                </span>
                            </div>
                            <div v-if="isAdmin && site.creator_username">
                                所有者：{{ site.creator_username }}
                                <span v-if="site.user_sub === 1" class="tag-admin">（管理员）</span>
                            </div>
                            <div>创建时间：{{ formatTime(site.created_at) }}</div>
                        </div>
                    </div>

                    <var-divider />

                    <div class="site-actions">
                        <var-button type="primary" text @click="openOverview(site)">
                            查看概览
                        </var-button>
                        <var-button type="default" text @click="openSnippet(site)">
                            嵌入代码
                        </var-button>
                        <var-button v-if="isAdmin" type="default" text @click="openTransferDialog(site.id)">
                            转移
                        </var-button>
                        <var-button type="danger" text @click="handleDelete(site)"
                            :disabled="!isAdmin && site.user_sub !== user?.sub">
                            删除
                        </var-button>
                    </div>
                </var-card>
            </var-list>
        </div>
    </var-pull-refresh>

    <!-- ─── 注册站点 ─── -->
    <var-popup v-model:show="showRegisterDialog" class="var-dialog__popup" var-dialog-cover @closed="resetForms">
        <div class="var--box var-dialog">
            <div class="var-dialog__title">注册新站点</div>
            <div class="dialog-message">
                <var-input placeholder="站点域名，如 example.com" v-model="registerForm.domain"
                    :rules="[(v) => !!v || '请输入域名']" />
                <var-input placeholder="站点名称（可选，默认使用域名）" v-model="registerForm.name" style="margin-top: 12px" />
                <p class="hint">
                    只填裸域名 —— 不要协议头，不要末尾斜杠。注册成功后会得到一个专属 Token 用于嵌入脚本。
                </p>
            </div>
            <div class="var-dialog__actions">
                <var-button @click="showRegisterDialog = false" text type="primary"
                    class="var--inline-flex var-dialog__button var-dialog__cancel-button">
                    取消
                </var-button>
                <var-button @click="handleRegister" text type="primary"
                    class="var--inline-flex var-dialog__button var-dialog__confirm-button">
                    注册
                </var-button>
            </div>
        </div>
    </var-popup>

    <!-- ─── 转移所有者（管理员） ─── -->
    <var-popup v-model:show="showTransferDialog" class="var-dialog__popup" var-dialog-cover @closed="resetForms">
        <div class="var--box var-dialog">
            <div class="var-dialog__title">转移站点所有者</div>
            <div class="dialog-message">
                <var-select placeholder="请选择站点" v-model="transferForm.siteId" style="margin-bottom: 15px">
                    <var-option v-for="site in sites" :key="site.id" :label="`${site.name}（${site.domain}）`"
                        :value="site.id" />
                </var-select>
                <var-select placeholder="请选择目标账号" v-model="transferForm.targetUserId">
                    <var-option v-for="u in users" :key="u.sub" :label="u.username" :value="u.sub" />
                </var-select>
            </div>
            <div class="var-dialog__actions">
                <var-button @click="showTransferDialog = false" text type="primary"
                    class="var--inline-flex var-dialog__button var-dialog__cancel-button">
                    取消
                </var-button>
                <var-button @click="handleTransfer" text type="primary"
                    class="var--inline-flex var-dialog__button var-dialog__confirm-button">
                    转移
                </var-button>
            </div>
        </div>
    </var-popup>

    <!-- ─── 嵌入代码 ─── -->
    <var-popup v-model:show="showSnippetDialog" class="var-dialog__popup" var-dialog-cover>
        <div class="var--box var-dialog">
            <div class="var-dialog__title">嵌入代码</div>
            <div class="dialog-message">
                <p class="hint">
                    将下面任一段代码粘贴到 <strong>{{ snippetSite?.domain }}</strong>
                    的 <code>&lt;head&gt;</code> 中即可开始统计。
                </p>

                <p class="snippet-label">写法一：Token 作为查询参数</p>
                <pre class="snippet" v-text="snippetQuery"></pre>

                <p class="snippet-label">写法二：Token 作为 data 属性</p>
                <pre class="snippet" v-text="snippetDataAttr"></pre>

                <p class="hint" style="margin-top: 12px">
                    两种写法等价，二选一即可。若同一标签同时声明
                    <code>?token=</code> 与 <code>data-token</code>，二者必须一致，否则本次上报将被拒绝。
                </p>
                <p class="hint">
                    自定义事件：在浏览器控制台或页面脚本里调用
                    <code>window.ayAnalytics('事件名')</code>。
                </p>
            </div>
            <div class="var-dialog__actions">
                <var-button @click="showSnippetDialog = false" text type="primary"
                    class="var--inline-flex var-dialog__button var-dialog__cancel-button">
                    关闭
                </var-button>
                <var-button @click="copySnippet" text type="primary"
                    class="var--inline-flex var-dialog__button var-dialog__confirm-button">
                    复制
                </var-button>
            </div>
        </div>
    </var-popup>
</template>

<style scoped>
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.page-header h2 {
    margin: 0;
}

.header-actions {
    display: flex;
    align-items: center;
}

.refresh-btn {
    margin-inline-end: 5px;
    margin-bottom: 5px;
}

.site-count {
    color: var(--color-text-secondary);
    margin-bottom: 16px;
}

.empty-tip {
    margin-bottom: 70px;
    color: var(--color-text-secondary);
}

.site-card {
    margin-bottom: 12px;
}

.site-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.site-name {
    font-size: 16px;
}

.site-meta {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin-top: 6px;
    line-height: 1.7;
}

.copyable {
    cursor: pointer;
    word-break: break-all;
}

.copyable:hover {
    color: var(--color-primary);
}

.tag-admin {
    color: var(--color-primary);
    font-size: 12px;
}

.site-actions {
    display: flex;
    justify-content: flex-end;
    gap: 4px;
    flex-wrap: wrap;
}

.dialog-message {
    padding: 0 24px 16px;
}

.hint {
    font-size: 12.5px;
    color: var(--color-text-secondary);
    margin: 8px 0 0;
    line-height: 1.6;
}

.snippet-label {
    font-size: 12.5px;
    color: var(--color-text-secondary);
    margin: 12px 0 4px;
    font-weight: 500;
}

.snippet {
    margin: 0;
    padding: 10px 12px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 6px;
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 12.5px;
    white-space: pre-wrap;
    word-break: break-all;
    user-select: all;
}

code {
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 12px;
    padding: 0 4px;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 3px;
}
</style>