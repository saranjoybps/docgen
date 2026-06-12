const NAVY = "#1e3a5f"
const BODY = "#1e293b"
const MUTED = "#64748b"
const BG = "#f8fafc"
const BORDER = "#e2e8f0"
const BLUE = "#2563eb"

const margin = 40
const pageWidth = 595.28
const contentWidth = pageWidth - margin * 2

function parseContent(content: string): any[] {
  const lines = content.split("\n")
  const elements: any[] = []
  let inTable = false
  let tableRows: string[][] = []
  let tableHeaders: string[] = []

  function flushTable() {
    if (tableRows.length === 0) return
    const body: any[] = []
    if (tableHeaders.length > 0) {
      body.push(tableHeaders.map((h) => ({
        text: h.trim(),
        bold: true,
        color: "#ffffff",
        fillColor: NAVY,
        alignment: "center",
        fontSize: 9,
      })))
    }
    tableRows.forEach((row, ri) => {
      body.push(row.map((cell, ci) => ({
        text: cell.trim(),
        fontSize: 9,
        color: BODY,
        fillColor: ri % 2 === 0 ? undefined : BG,
        bold: ci === 0,
      })))
    })
    elements.push({
      table: {
        headerRows: tableHeaders.length > 0 ? 1 : 0,
        widths: new Array(tableHeaders.length || tableRows[0]?.length || 1).fill("*"),
        body,
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0,
        hLineColor: () => BORDER,
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 5,
        paddingBottom: () => 5,
      },
      margin: [0, 8, 0, 8],
    })
    tableRows = []
    tableHeaders = []
  }

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ""

    if (!trimmed) {
      if (inTable) { flushTable(); inTable = false }
      elements.push({ text: "", margin: [0, 3, 0, 3] })
      continue
    }

    if (trimmed.includes("|") && trimmed.split("|").length >= 3) {
      inTable = true
      const cells = trimmed.split("|").filter((c) => c.trim())
      if (nextLine.includes("---") || nextLine.match(/[-:]+\|/)) {
      } else if (tableHeaders.length === 0 && tableRows.length === 0) {
        tableHeaders = cells
      } else {
        tableRows.push(cells)
      }
      continue
    }

    if (inTable) { flushTable(); inTable = false }

    if (/^[A-Z0-9][.)]\s+[A-Z]/.test(trimmed)) {
      elements.push({
        columns: [
          { canvas: [{ type: "rect", x: 0, y: 0, w: 3, h: 14, color: BLUE }], width: 3 },
          { text: trimmed, style: "sectionHeader", margin: [8, 0, 0, 0] },
        ],
        margin: [0, 10, 0, 4],
      })
      continue
    }

    if (/^[A-Z\s]{3,}$/.test(trimmed) && trimmed.length > 10) {
      elements.push({ text: trimmed, style: "sectionCenter", margin: [0, 10, 0, 6] })
      continue
    }

    if (trimmed.toLowerCase().startsWith("subject:")) {
      elements.push({ text: trimmed, style: "subject" })
      continue
    }

    if (/^(Dear|To,?)/i.test(trimmed)) {
      elements.push({ text: trimmed, style: "greeting" })
      continue
    }

    if (/_{3,}/.test(trimmed) || /-{3,}/.test(trimmed)) {
      elements.push({
        canvas: [{ type: "line", x1: 0, y1: 0, x2: contentWidth, y2: 0, thickness: 1, color: BORDER }],
        margin: [0, 8, 0, 8],
      })
      continue
    }

    if (/^(Sincerely|Yours|Best|Regards|Thanking|IN WITNESS)/i.test(trimmed) && nextLine === "") {
      elements.push({ text: trimmed, style: "signatureBold" })
      continue
    }

    if (trimmed.includes("_______________") || trimmed.includes("________")) {
      elements.push({ text: trimmed, style: "signatureLine" })
      continue
    }

    if (trimmed.includes(":") && !/^http/i.test(trimmed)) {
      const parts = trimmed.split(":")
      if (parts[0].trim().length < 30) {
        elements.push({
          text: [
            { text: parts[0] + ":", bold: true, color: NAVY },
            { text: parts.slice(1).join(":"), color: BODY },
          ],
          style: "body",
        })
        continue
      }
    }

    elements.push({ text: trimmed, style: "body" })
  }

  if (inTable) flushTable()
  return elements
}

function requiresSignature(docType: string): boolean {
  const lower = docType.toLowerCase()
  if (lower.includes("payslip") || lower.includes("id card")) {
    return false
  }
  return true
}

let pdfMakeInstance: any = null

async function getPdfMake(): Promise<any> {
  if (pdfMakeInstance) return pdfMakeInstance
  const [pdfMakeModule, pdfFontsModule] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ])
  const pdfMake = pdfMakeModule.default || pdfMakeModule
  const vfsData = pdfFontsModule.default || pdfFontsModule
  if (typeof pdfMake.addVirtualFileSystem === "function" && vfsData) {
    pdfMake.addVirtualFileSystem(vfsData)
  }
  pdfMakeInstance = pdfMake
  return pdfMake
}

async function imageUrlToDataUrl(url: string): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url, { mode: "cors" })
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function generateDocumentPdfBlob(
  content: string,
  docType: string,
  employeeName: string,
  settings?: {
    companyName?: string
    address?: string
    phone?: string
    website?: string
    logoUrl?: string
    signatureUrl?: string
    footerText?: string
  }
): Promise<Blob> {
  const pdfMake = await getPdfMake()

  const companyName = settings?.companyName || "DOCUMENTS MANAGEMENT"
  const address = settings?.address || ""
  const phone = settings?.phone || ""
  const website = settings?.website || ""
  const logoUrl = settings?.logoUrl || ""
  const signatureUrl = settings?.signatureUrl || ""
  const footerText = settings?.footerText || ""

  const [logoDataUrl, signatureDataUrl] = await Promise.all([
    imageUrlToDataUrl(logoUrl),
    imageUrlToDataUrl(signatureUrl),
  ])

  const firstPageHeader = logoDataUrl
    ? {
        columns: [
          { image: logoDataUrl, width: 56, height: 56, alignment: "left" },
          {
            stack: [
              { text: companyName, fontSize: 16, bold: true, color: NAVY, margin: [0, 2, 0, 0] },
              ...(address ? [{ text: address, fontSize: 8, color: MUTED, margin: [4, 0, 0, 0] }] : []),
              ...(phone || website ? [{ text: [phone, website].filter(Boolean).join(" | "), fontSize: 8, color: MUTED, margin: [4, 1, 0, 0] }] : []),
            ],
            margin: [12, 0, 0, 0],
          },
        ],
        margin: [0, 0, 0, 6],
      }
    : {
        stack: [
          { text: companyName, fontSize: 16, bold: true, color: NAVY },
          ...(address || phone || website ? [{ text: [address, phone, website].filter(Boolean).join(" · "), fontSize: 9, color: MUTED, margin: [0, 2, 0, 0] }] : []),
        ],
        margin: [0, 0, 0, 6],
      }

  const headerLine = {
    canvas: [{ type: "line", x1: 0, y1: 0, x2: contentWidth, y2: 0, thickness: 1, color: BORDER }],
  }

  const showSignature = !!signatureDataUrl && requiresSignature(docType)

  const docDefinition: any = {
    pageSize: "A4",
    pageMargins: [margin, 120, margin, 60],

    background: (currentPage: number, pageSize: { width: number; height: number }) => {
      if (!logoDataUrl) return null
      const w = pageSize.width * 0.35
      return {
        image: logoDataUrl,
        width: w,
        opacity: 0.04,
        absolutePosition: {
          x: (pageSize.width - w) / 2,
          y: (pageSize.height - w) / 2,
        },
      }
    },

    header: (currentPage: number) => {
      if (currentPage === 1) {
        return {
          margin: [margin, 16, margin, 0],
          stack: [firstPageHeader, headerLine],
        }
      }
      return {
        margin: [margin, 10, margin, 0],
        stack: [
          { text: companyName, fontSize: 9, color: MUTED },
          { canvas: [{ type: "line", x1: 0, y1: 0, x2: contentWidth, y2: 0, thickness: 0.5, color: BORDER }], margin: [0, 4, 0, 0] },
        ],
      }
    },

    footer: (currentPage: number, pageCount: number) => ({
      margin: [margin, 0, margin, 14],
      stack: [
        { canvas: [{ type: "line", x1: 0, y1: 0, x2: contentWidth, y2: 0, thickness: 0.5, color: BORDER }], margin: [0, 0, 0, 6] },
        {
          columns: [
            { text: footerText || companyName, fontSize: 8, color: MUTED, alignment: "left" },
            { text: `Page ${currentPage} of ${pageCount}`, fontSize: 8, color: MUTED, alignment: "right" },
          ],
        },
      ],
    }),

    content: [
      { text: docType, style: "title" },
      ...parseContent(content),
      ...(showSignature
        ? [
            { text: "", margin: [0, 24, 0, 0] },
            { text: "Authorized Signature", fontSize: 10, bold: true, color: NAVY, margin: [0, 0, 0, 8] },
            { image: signatureDataUrl!, width: 130, margin: [0, 0, 0, 4] },
            { text: companyName, fontSize: 10, color: BODY },
          ]
        : []),
    ],

    styles: {
      title: {
        fontSize: 16,
        bold: true,
        color: NAVY,
        alignment: "center",
        margin: [0, 0, 0, 14],
      },
      sectionHeader: {
        fontSize: 11,
        bold: true,
        color: NAVY,
      },
      sectionCenter: {
        fontSize: 12,
        bold: true,
        color: NAVY,
        alignment: "center",
      },
      subject: {
        fontSize: 10,
        bold: true,
        color: NAVY,
        margin: [0, 4, 0, 10],
      },
      greeting: {
        fontSize: 10,
        color: BODY,
        margin: [0, 4, 0, 2],
      },
      body: {
        fontSize: 10,
        color: BODY,
        lineHeight: 1.6,
        margin: [0, 1.5, 0, 1.5],
      },
      signatureBold: {
        fontSize: 10,
        bold: true,
        color: NAVY,
        margin: [0, 16, 0, 2],
      },
      signatureLine: {
        fontSize: 10,
        color: BODY,
        margin: [0, 8, 0, 0],
      },
    },

    defaultStyle: {
      font: "Roboto",
    },
  }

  return new Promise<Blob>((resolve) => {
    const pdfDoc = pdfMake.createPdf(docDefinition)
    pdfDoc.getBlob((blob: Blob) => {
      resolve(blob)
    })
  })
}
