/// <reference types="vite/client" />
declare global {
  interface Window {
    WeixinJSBridge?: {
      invoke: (
        method: string,
        params: Record<string, unknown>,
        callback: (res: { err_msg: string }) => void,
      ) => void
    }
  }
}
declare global {
  // ------------------------------------------------------------------
  // Window 扩展
  // ------------------------------------------------------------------
  interface Window {
    /**
     * 显示一个文件选择器，允许用户选择一个或多个文件，返回文件句柄数组。
     * @param options - 配置选项
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/showOpenFilePicker
     */
    showOpenFilePicker(options?: ShowOpenFilePickerOptions): Promise<FileSystemFileHandle[]>
  }

  // ------------------------------------------------------------------
  // showOpenFilePicker 的选项类型
  // ------------------------------------------------------------------
  interface ShowOpenFilePickerOptions {
    /**
     * 限定可选择的文件类型，每个类型包含描述和 MIME 类型/扩展名映射。
     */
    types?: FilePickerAcceptType[]

    /**
     * 是否允许多选，默认为 false。
     */
    multiple?: boolean

    /**
     * 是否在文件选择器中隐藏“所有文件”选项，默认为 false。
     */
    excludeAcceptAllOption?: boolean

    /**
     * 建议起始目录（例如 'desktop', 'documents', 'downloads' 或一个已存在的句柄）。
     */
    startIn?: WellKnownDirectory | FileSystemHandle

    /**
     * 用于标识同一来源下不同选择器的 ID，可记录用户上次选择的目录。
     */
    id?: string
  }

  /**
   * 文件选择器的可接受类型定义。
   */
  interface FilePickerAcceptType {
    /**
     * 对文件类型的描述（例如 "Images"）。
     */
    description?: string

    /**
     * MIME 类型到文件扩展名数组的映射，例如 `{ "image/*": [".png", ".jpg"] }`。
     */
    accept: Record<string, string[]>
  }

  /**
   * 已知的起始目录名称（浏览器支持的快捷位置）。
   */
  type WellKnownDirectory = 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'

  // ------------------------------------------------------------------
  // FileSystemFileHandle 完整定义
  // ------------------------------------------------------------------
  interface FileSystemFileHandle {
    /**
     * 句柄类型，固定为 'file'。
     */
    readonly kind: 'file'

    /**
     * 文件名（不含路径）。
     */
    readonly name: string

    /**
     * 获取文件对象（File），可读取内容。
     */
    getFile(): Promise<File>

    /**
     * 创建一个可写的流，用于写入文件内容。
     * @param options - 写入选项（keepExistingData 等）
     */
    createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>

    /**
     * 移动或重命名该文件。
     * @param destinationOrName - 目标目录句柄或新文件名
     * @param newName - 如果第一个参数是目录句柄，则此参数为新文件名
     */
    move(destinationOrName: FileSystemDirectoryHandle | string, newName?: string): Promise<void>

    /**
     * 删除该文件。
     * @param options - 是否递归删除（对文件无影响，仅保持接口一致）
     */
    remove(options?: { recursive?: boolean }): Promise<void>

    /**
     * 判断当前句柄是否与另一个句柄指向同一文件。
     */
    isSameEntry(other: FileSystemHandle): Promise<boolean>
  }

  // ------------------------------------------------------------------
  // 辅助类型（FileSystemHandle 基类、目录句柄等）
  // ------------------------------------------------------------------
  interface FileSystemHandle {
    readonly kind: 'file' | 'directory'
    readonly name: string
    isSameEntry(other: FileSystemHandle): Promise<boolean>
  }

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    readonly kind: 'directory'
    getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>
    getDirectoryHandle(
      name: string,
      options?: { create?: boolean },
    ): Promise<FileSystemDirectoryHandle>
    removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>
    resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>
    keys(): AsyncIterableIterator<string>
    values(): AsyncIterableIterator<FileSystemHandle>
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>
    [Symbol.asyncIterator](): AsyncIterableIterator<[string, FileSystemHandle]>
  }

  /**
   * 创建可写流的选项。
   */
  interface FileSystemCreateWritableOptions {
    keepExistingData?: boolean
  }

  /**
   * 可写文件流（用于分块写入）。
   */
  interface FileSystemWritableFileStream extends WritableStream {
    write(data: FileSystemWriteChunkType): Promise<void>
    seek(position: number): Promise<void>
    truncate(size: number): Promise<void>
    close(): Promise<void>
  }

  type FileSystemWriteChunkType =
    | BufferSource
    | Blob
    | string
    | { type: 'write'; data: BufferSource | Blob | string; position?: number }
    | { type: 'seek'; position: number }
    | { type: 'truncate'; size: number }
}

// 必须要有 export {} 才能使上述声明成为全局扩充
export {}
