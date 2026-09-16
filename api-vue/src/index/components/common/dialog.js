/* ============================================================
   函数式弹窗 API
   —— 动态挂载 GovDialog，卸载由 Transition 的 after-leave 触发
   —— 返回值：Promise<'confirm' | 'cancel' | 'close'>
   ============================================================ */

import { createApp, h, reactive } from 'vue'
import GovDialog from './GovDialog.vue'

/**
 * @param {Object} options
 * @param {string}   [options.title]          标题
 * @param {any}      [options.content]        正文内容（字符串 / VNode / 返回 VNode 的函数）
 * @param {Object}   [options.slots]          透传具名插槽 { header, footer, default }
 * @param {Function} [options.onConfirm]      确认回调，支持 async，期间按钮自动 loading
 * @param {Function} [options.onCancel]       取消回调
 * @param {Function} [options.onClose]        关闭回调（含右上角 ×、遮罩、ESC）
 * @returns {Promise<'confirm' | 'cancel' | 'close'>}
 */
export function showDialog(options = {}) {
    const { onConfirm, onCancel, onClose, content, slots, ...rest } = options

    return new Promise((resolve) => {
        const container = document.createElement('div')
        document.body.appendChild(container)

        const state = reactive({
            visible: true,
            confirmLoading: false,
        })

        let app = null
        let destroyed = false

        const destroy = () => {
            if (destroyed) return
            destroyed = true
            if (app) {
                app.unmount()
                app = null
            }
            container.remove()
        }

        let settled = false
        const settle = (result) => {
            if (settled) return
            settled = true
            resolve(result)
        }

        const handleConfirm = async () => {
            if (state.confirmLoading) return
            if (typeof onConfirm === 'function') {
                state.confirmLoading = true
                try {
                    await onConfirm()
                } catch (err) {
                    // 业务方自行处理错误，弹窗保持打开
                    state.confirmLoading = false
                    return
                }
                state.confirmLoading = false
            }
            settle('confirm')
            state.visible = false
        }

        const handleCancel = () => {
            if (typeof onCancel === 'function') onCancel()
            settle('cancel')
            state.visible = false
        }

        const handleClose = () => {
            if (typeof onClose === 'function') onClose()
            settle('close')
            state.visible = false
        }

        app = createApp({
            render() {
                return h(
                    GovDialog,
                    {
                        ...rest,
                        // 强制由函数式自行控制关闭时机（支持异步 onConfirm）
                        closeOnConfirm: false,
                        modelValue: state.visible,
                        confirmLoading: state.confirmLoading,
                        'onUpdate:modelValue': (v) => { state.visible = v },
                        onConfirm: handleConfirm,
                        onCancel: handleCancel,
                        onClose: handleClose,
                        onAfterLeave: destroy,
                    },
                    {
                        default: () =>
                            typeof content === 'function' ? content() : content,
                        ...(slots || {}),
                    }
                )
            },
        })

        app.mount(container)
    })
}

/** 便捷：警告框（只有一个确定按钮） */
export function showAlert(content, title = '提示', options = {}) {
    return showDialog({
        title,
        content,
        showCancel: false,
        ...options,
    })
}

/** 便捷：危险确认框（红色确定按钮） */
export function showConfirm(content, title = '操作确认', options = {}) {
    return showDialog({
        title,
        content,
        tone: 'red',
        confirmVariant: 'danger',
        ...options,
    })
}