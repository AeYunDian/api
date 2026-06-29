/// <reference types="vite/client" />

interface Window {
  showOpenFilePicker(options?: {
    types?: Array<{
      description?: string
      accept: Record<string, string[]>
    }>
    multiple?: boolean
    excludeAcceptAllOption?: boolean
  }): Promise<Array<FileSystemFileHandle>>
}

// 补充 FileSystemFileHandle 类型，避免在获取 file 时报错
interface FileSystemFileHandle {
  getFile(): Promise<File>
}
