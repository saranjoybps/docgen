declare module "pdfmake/build/pdfmake" {
  interface TDocumentDefinition {
    pageSize?: string
    pageOrientation?: string
    pageMargins?: [number, number, number, number]
    background?: (currentPage: number, pageSize: { width: number; height: number }) => any
    header?: (currentPage: number, pageCount: number) => any
    footer?: (currentPage: number, pageCount: number) => any
    content: any[]
    styles?: Record<string, any>
    defaultStyle?: Record<string, any>
  }

  interface PdfMake {
    vfs: Record<string, string>
    fonts: Record<string, {
      normal: string
      bold?: string
      italics?: string
      bolditalics?: string
    }>
    virtualfs: any
    addVirtualFileSystem(vfs: Record<string, string>): void
    addFonts(fonts: Record<string, unknown>): void
    setFonts(fonts: Record<string, unknown>): void
    createPdf(docDefinition: TDocumentDefinition): {
      getBlob: (callback?: (blob: Blob) => void) => Promise<Blob>
      download: (filename?: string, cb?: () => void) => void
      open: () => void
      print: () => void
    }
  }

  const pdfMake: PdfMake
  export default pdfMake
}

declare module "pdfmake/build/vfs_fonts" {
  const vfs: Record<string, string>
  export default vfs
  export = vfs
}
