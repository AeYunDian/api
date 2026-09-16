<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
    nextZIndex,
    createDialogId,
    pushDialog,
    popDialog,
    isTopDialog,
    lockScroll,
    unlockScroll,
} from './dialog-manager'
import MyIcon from '@/shared/MyIcon.vue'

defineOptions({ name: 'GovDialog' })

const props = defineProps({
    /* 受控显示 */
    modelValue: { type: Boolean, default: false },
    /* 标题 */
    title: { type: String, default: '' },
    /* 宽度：数字（px）或字符串 */
    width: { type: [String, Number], default: 480 },
    minWidth: { type: String, default: '280px' },
    maxWidth: { type: String, default: '92vw' },
    /* 距顶部距离 */
    top: { type: String, default: '15vh' },
    /* 交互 */
    maskClosable: { type: Boolean, default: true },
    escClosable: { type: Boolean, default: true },
    showClose: { type: Boolean, default: true },
    lockScroll: { type: Boolean, default: true },
    /* 底部 */
    showFooter: { type: Boolean, default: true },
    showCancel: { type: Boolean, default: true },
    confirmText: { type: String, default: '确定' },
    cancelText: { type: String, default: '取消' },
    confirmVariant: { type: String, default: 'primary' }, // primary | danger | ghost
    confirmLoading: { type: Boolean, default: false },
    confirmDisabled: { type: Boolean, default: false },
    /* 点击确定后是否自动关闭（异步确认时请设为 false） */
    closeOnConfirm: { type: Boolean, default: true },
    /* 视觉色调 */
    tone: { type: String, default: 'blue' }, // blue | red | gray
    /* 自定义 z-index，不传则自动分配 */
    zIndex: { type: Number, default: 0 },
})

const emit = defineEmits([
    'update:modelValue',
    'confirm',
    'cancel',
    'close',
    'open',
    'afterLeave',
])

const uid = createDialogId()
const dialogRef = ref(null)
const zIndex = ref(props.zIndex || nextZIndex())
const scrollLocked = ref(false)

const titleId = `${uid}-title`

const widthStyle = computed(() =>
    typeof props.width === 'number' ? `${props.width}px` : props.width
)

/* ---------------- 生命周期：入栈 / 滚动锁 ---------------- */
function open() {
    pushDialog(uid)
    if (props.lockScroll && !scrollLocked.value) {
        lockScroll()
        scrollLocked.value = true
    }
    emit('open')
    nextTick(() => dialogRef.value?.focus?.({ preventScroll: true }))
}

function release() {
    if (scrollLocked.value) {
        unlockScroll()
        scrollLocked.value = false
    }
    popDialog(uid)
}

watch(
    () => props.modelValue,
    (val) => {
        if (val) {
            zIndex.value = props.zIndex || nextZIndex()
            open()
        } else {
            release()
        }
    },
    { immediate: true }
)

/* ---------------- 关闭 ---------------- */
function close() {
    emit('update:modelValue', false)
    emit('close')
}

function handleConfirm() {
    if (props.confirmLoading || props.confirmDisabled) return
    emit('confirm')
    if (props.closeOnConfirm) close()
}

function handleCancel() {
    emit('cancel')
    close()
}

function handleMaskClick() {
    if (props.maskClosable) close()
}

/* ---------------- ESC 关闭（仅栈顶响应） ---------------- */
function onKeydown(e) {
    if (e.key !== 'Escape') return
    if (!props.escClosable) return
    if (!isTopDialog(uid)) return
    e.stopPropagation()
    close()
}

onMounted(() => document.addEventListener('keydown', onKeydown, true))

onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown, true)
    // 防止组件在打开状态下被卸载，导致栈 / 锁未清理
    release()
})
</script>

<template>
    <Teleport to="body">
        <Transition name="gov-dlg" appear @after-leave="emit('afterLeave')">
            <div v-if="modelValue" class="gov-dialog__mask" :style="{ zIndex, '--gov-dialog-top': top }"
                @click="handleMaskClick">
                <div ref="dialogRef" class="gov-dialog" :class="`gov-dialog--${tone}`" role="dialog" aria-modal="true"
                    :aria-labelledby="title ? titleId : undefined" :aria-label="title ? undefined : '对话框'" tabindex="-1"
                    :style="{ width: widthStyle, minWidth, maxWidth }" @click.stop>
                    <!-- 头部 -->
                    <header v-if="title || $slots.header || showClose" class="gov-dialog__head">
                        <h3 v-if="title" :id="titleId" class="gov-dialog__title">{{ title }}</h3>
                        <slot name="header" />
                        <button v-if="showClose" class="gov-dialog__close" type="button" aria-label="关闭" @click="close">
                            <MyIcon icon="close" />
                        </button>
                    </header>

                    <!-- 内容 -->
                    <div class="gov-dialog__body">
                        <slot />
                    </div>

                    <!-- 底部 -->
                    <footer v-if="showFooter || $slots.footer" class="gov-dialog__foot">
                        <slot name="footer">
                            <button v-if="showCancel" class="gov-dialog__btn gov-dialog__btn--ghost" type="button"
                                @click="handleCancel">
                                {{ cancelText }}
                            </button>
                            <button class="gov-dialog__btn" :class="`gov-dialog__btn--${confirmVariant}`" type="button"
                                :disabled="confirmDisabled || confirmLoading" @click="handleConfirm">
                                <span v-if="confirmLoading" class="gov-dialog__spinner" aria-hidden="true" />
                                {{ confirmText }}
                            </button>
                        </slot>
                    </footer>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
/* ---------------- 遮罩 ---------------- */
.gov-dialog__mask {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: var(--gov-dialog-top, 15vh) var(--gov-gap-lg) var(--gov-gap-lg);
    background: rgba(0, 0, 0, .45);
    overflow-y: auto;
    overscroll-behavior: contain;
}

/* ---------------- 弹窗主体 ---------------- */
.gov-dialog {
    position: relative;
    display: flex;
    flex-direction: column;
    background: var(--gov-bg);
    border: 1px solid var(--gov-border-deep);
    box-shadow: 0 8px 32px rgba(0, 0, 0, .24);
    outline: none;
    max-height: calc(100vh - var(--gov-dialog-top, 15vh) - var(--gov-gap-lg) * 2);
}

/* ---------------- 头部 ---------------- */
.gov-dialog__head {
    flex: none;
    display: flex;
    align-items: center;
    gap: var(--gov-gap-sm);
    height: 44px;
    padding: 0 var(--gov-gap-lg);
    border-top: 3px solid var(--gov-blue-deep);
    border-bottom: 1px solid var(--gov-border);
    background: var(--gov-bg);
}

.gov-dialog__title {
    flex: 1;
    min-width: 0;
    font-family: var(--gov-font-title);
    font-size: var(--gov-fs-lg);
    font-weight: 700;
    letter-spacing: 1px;
    color: var(--gov-blue-deep);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.gov-dialog--red .gov-dialog__head {
    border-top-color: var(--gov-red-deep);
}

.gov-dialog--red .gov-dialog__title {
    color: var(--gov-red-deep);
}

.gov-dialog--gray .gov-dialog__head {
    border-top-color: #777;
}

.gov-dialog--gray .gov-dialog__title {
    color: #333;
}

/* 关闭按钮 */
.gov-dialog__close {
    flex: none;
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--gov-text-muted);
    border-radius: var(--gov-radius-sm);
    transition: color .15s, background .15s;
}

.gov-dialog__close:hover {
    color: var(--gov-red);
    background: var(--gov-bg-gray);
}

/* ---------------- 内容 ---------------- */
.gov-dialog__body {
    flex: 1;
    min-height: 0;
    padding: var(--gov-gap-lg);
    overflow-y: auto;
    font-size: var(--gov-fs-base);
    line-height: 1.9;
    color: var(--gov-text);
}

.gov-dialog__body :deep(p) {
    margin-bottom: var(--gov-gap-md);
}

.gov-dialog__body :deep(p:last-child) {
    margin-bottom: 0;
}

/* ---------------- 底部 ---------------- */
.gov-dialog__foot {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: var(--gov-gap-md);
    padding: var(--gov-gap-md) var(--gov-gap-lg);
    border-top: 1px solid var(--gov-border);
    background: var(--gov-bg-gray);
}

/* ---------------- 按钮 ---------------- */
.gov-dialog__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 32px;
    padding: 0 var(--gov-gap-xl);
    font-size: var(--gov-fs-base);
    font-family: var(--gov-font-title);
    letter-spacing: 1px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: background .15s, border-color .15s, color .15s;
}

.gov-dialog__btn:disabled {
    opacity: .6;
    cursor: not-allowed;
}

.gov-dialog__btn--primary {
    background: var(--gov-btn-primary);
    border-color: var(--gov-btn-primary-border);
    color: #fff;
    font-weight: 700;
}

.gov-dialog__btn--primary:hover:not(:disabled) {
    background: var(--gov-btn-primary-hover);
}

.gov-dialog__btn--danger {
    background: var(--gov-btn-red);
    border-color: var(--gov-btn-red-border);
    color: #fff;
    font-weight: 700;
}

.gov-dialog__btn--danger:hover:not(:disabled) {
    background: var(--gov-btn-red-hover);
}

.gov-dialog__btn--ghost {
    background: var(--gov-bg);
    border-color: var(--gov-border-deep);
    color: var(--gov-text);
}

.gov-dialog__btn--ghost:hover:not(:disabled) {
    border-color: var(--gov-blue);
    color: var(--gov-blue);
}

/* 加载圈 */
.gov-dialog__spinner {
    width: 12px;
    height: 12px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: gov-dlg-spin .7s linear infinite;
}

@keyframes gov-dlg-spin {
    to {
        transform: rotate(360deg);
    }
}

/* ---------------- 过渡动画 ---------------- */
.gov-dlg-enter-active,
.gov-dlg-leave-active {
    transition: opacity .2s ease;
}

.gov-dlg-enter-active .gov-dialog,
.gov-dlg-leave-active .gov-dialog {
    transition: transform .22s ease-out, opacity .2s ease;
}

.gov-dlg-enter-from,
.gov-dlg-leave-to {
    opacity: 0;
}

.gov-dlg-enter-from .gov-dialog,
.gov-dlg-leave-to .gov-dialog {
    opacity: 0;
    transform: translateY(-12px) scale(.98);
}

/* ---------------- 响应式 ---------------- */
@media (max-width: 520px) {
    .gov-dialog__foot {
        flex-wrap: nowrap;
    }

    .gov-dialog__btn {
        flex: 1;
        min-width: 0;
        padding: 0 var(--gov-gap-md);
    }
}
</style>