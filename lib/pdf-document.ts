import type { CompanySettings } from "./types"
import { buildDesign, buildDocumentDefinition, requiresSignature } from "./document-design"

const BODY = "#1e293b"
const BG = "#f8fafc"
const BORDER = "#e2e8f0"

const NAVY = "#1e3a5f"

function getContentWidth(marginLeft: number, marginRight: number) {
  return 595.28 - marginLeft - marginRight
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseContent(content: string, marginLeft = 40, marginRight = 40): any[] {
  const lines = content.split("\n")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elements: any[] = []
  let inTable = false
  let tableRows: string[][] = []
  let tableHeaders: string[] = []

  function flushTable() {
    if (tableRows.length === 0) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      margin: [0, 6, 0, 6],
    })
    tableRows = []
    tableHeaders = []
  }

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ""

    if (!trimmed) {
      if (inTable) { flushTable(); inTable = false }
      elements.push({ text: "", margin: [0, 1.5, 0, 1.5] })
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

    if (/^[A-Z0-9]+[.)]\s+[A-Z]/.test(trimmed)) {
      elements.push({ text: trimmed, style: "sectionHeader", margin: [0, 4, 0, 1] })
      continue
    }

    if (/^[A-Z\s]{3,}:\s*$/.test(trimmed) && trimmed.length > 10) {
      elements.push({ text: trimmed, style: "sectionCenter", margin: [0, 4, 0, 2] })
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
        canvas: [{ type: "line", x1: 0, y1: 0, x2: getContentWidth(marginLeft, marginRight), y2: 0, thickness: 0.5, color: BORDER }],
        margin: [0, 6, 0, 6],
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfMakeInstance: any = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  settings?: CompanySettings
): Promise<Blob> {
  const pdfMake = await getPdfMake()
  const design = buildDesign(settings || {
    companyName: "DOCUMENTS MANAGEMENT",
    address: "",
    phone: "",
    email: "",
    website: "",
    registrationNumber: "",
    gstNumber: "",
    logoUrl: "",
    logoPublicId: "",
    signatureUrl: "",
    signaturePublicId: "",
    footerText: "",
  })

  const [logoDataUrl, signatureDataUrl] = await Promise.all([
    imageUrlToDataUrl(design.logoUrl),
    imageUrlToDataUrl(design.signatureUrl),
  ])

  const contentElements = parseContent(content, design.marginLeft, design.marginRight)
  const showSignature = !!signatureDataUrl && requiresSignature(docType)

  const docDefinition = buildDocumentDefinition(contentElements, design, {
    documentTitle: docType,
    logoDataUrl,
    signatureDataUrl: showSignature ? signatureDataUrl : null,
  })

  const pdfDoc = pdfMake.createPdf(docDefinition)
  return pdfDoc.getBlob()
}
