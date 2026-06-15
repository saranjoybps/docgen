import type { CompanySettings, DocumentDesign } from "./types"

const DEFAULT_DESIGN = {
  primaryColor: "#1e3a5f",
  secondaryColor: "#2563eb",
  bodyColor: "#000000",
  mutedColor: "#64748b",
  watermarkEnabled: true,
  showPageNumbers: true,
  marginTop: 80,
  marginBottom: 60,
  marginLeft: 40,
  marginRight: 40,
  bodyFontSize: 10.5,
  titleFontSize: 16,
  watermarkOpacity: 0.04,
} as const

export function buildDesign(settings: CompanySettings): DocumentDesign {
  return {
    companyName: settings.companyName,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    website: settings.website,
    registrationNumber: settings.registrationNumber || "",
    gstNumber: settings.gstNumber || "",
    logoUrl: settings.logoUrl,
    logoPublicId: settings.logoPublicId,
    signatureUrl: settings.signatureUrl,
    signaturePublicId: settings.signaturePublicId,
    footerText: settings.footerText,
    primaryColor: settings.primaryColor ?? DEFAULT_DESIGN.primaryColor,
    secondaryColor: settings.secondaryColor ?? DEFAULT_DESIGN.secondaryColor,
    bodyColor: settings.bodyColor ?? DEFAULT_DESIGN.bodyColor,
    mutedColor: settings.mutedColor ?? DEFAULT_DESIGN.mutedColor,
    watermarkEnabled: settings.watermarkEnabled ?? DEFAULT_DESIGN.watermarkEnabled,
    showPageNumbers: settings.showPageNumbers ?? DEFAULT_DESIGN.showPageNumbers,
    marginTop: settings.marginTop ?? DEFAULT_DESIGN.marginTop,
    marginBottom: settings.marginBottom ?? DEFAULT_DESIGN.marginBottom,
    marginLeft: settings.marginLeft ?? DEFAULT_DESIGN.marginLeft,
    marginRight: settings.marginRight ?? DEFAULT_DESIGN.marginRight,
    bodyFontSize: settings.bodyFontSize ?? DEFAULT_DESIGN.bodyFontSize,
    titleFontSize: settings.titleFontSize ?? DEFAULT_DESIGN.titleFontSize,
    watermarkOpacity: settings.watermarkOpacity ?? DEFAULT_DESIGN.watermarkOpacity,
  }
}

function getContentWidth(marginLeft: number, marginRight: number) {
  return 595.28 - marginLeft - marginRight
}

export function buildHeader(design: DocumentDesign, currentPage: number, logoDataUrl?: string) {
  if (currentPage === 1) {
    const headerContent = logoDataUrl
      ? {
          columns: [
            { image: logoDataUrl, width: 56, height: 56, alignment: "left" },
            {
              stack: [
                { text: design.companyName, fontSize: 16, bold: true, color: design.primaryColor, margin: [0, 2, 0, 0] },
                ...(design.address ? [{ text: design.address, fontSize: 8, color: design.mutedColor, margin: [4, 0, 0, 0] }] : []),
                ...(design.phone || design.website
                  ? [{ text: [design.phone, design.website].filter(Boolean).join(" | "), fontSize: 8, color: design.mutedColor, margin: [4, 1, 0, 0] }]
                  : []),
              ],
              margin: [12, 0, 0, 0],
            },
          ],
          margin: [0, 0, 0, 6],
        }
      : {
          stack: [
            { text: design.companyName, fontSize: 16, bold: true, color: design.primaryColor },
            ...(design.address || design.phone || design.website
              ? [{ text: [design.address, design.phone, design.website].filter(Boolean).join(" \u00b7 "), fontSize: 9, color: design.mutedColor, margin: [0, 2, 0, 0] }]
              : []),
          ],
          margin: [0, 0, 0, 6],
        }

    return {
      margin: [DEFAULT_DESIGN.marginLeft, 28, DEFAULT_DESIGN.marginRight, 0],
      stack: [
        headerContent,
      ],
    }
  }

  return
}

export function buildFooter(design: DocumentDesign, currentPage: number, pageCount: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: any[] = [
    { text: design.footerText || design.companyName, fontSize: 8, color: design.mutedColor, alignment: "left" },
  ]

  if (design.showPageNumbers) {
    columns.push({
      text: `Page ${currentPage} of ${pageCount}`,
      fontSize: 8,
      color: design.mutedColor,
      alignment: "right",
    })
  }

  return {
    margin: [DEFAULT_DESIGN.marginLeft, 0, DEFAULT_DESIGN.marginRight, 14],
    stack: [
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: getContentWidth(design.marginLeft, design.marginRight), y2: 0, thickness: 0.5, color: design.mutedColor }], margin: [0, 0, 0, 6] },
      { columns },
    ],
  }
}

export function buildBackground(design: DocumentDesign, pageSize: { width: number; height: number }, logoDataUrl?: string) {
  if (!design.watermarkEnabled || !logoDataUrl) return null
  const w = pageSize.width * 0.35
  return {
    image: logoDataUrl,
    width: w,
    opacity: design.watermarkOpacity,
    absolutePosition: {
      x: (pageSize.width - w) / 2,
      y: (pageSize.height - w) / 2,
    },
  }
}

export function buildStyles(design: DocumentDesign) {
  return {
    title: {
      fontSize: design.titleFontSize,
      bold: true,
      color: design.primaryColor,
      alignment: "center",
      margin: [0, 0, 0, 18],
    },
    sectionHeader: {
      fontSize: 11,
      bold: true,
      color: design.primaryColor,
    },
    sectionCenter: {
      fontSize: 12,
      bold: true,
      color: design.primaryColor,
      alignment: "center",
    },
    subject: {
      fontSize: design.bodyFontSize,
      bold: true,
      color: design.primaryColor,
      margin: [0, 3, 0, 6],
    },
    greeting: {
      fontSize: design.bodyFontSize,
      color: design.bodyColor,
      margin: [0, 3, 0, 1],
    },
    body: {
      fontSize: design.bodyFontSize,
      color: design.bodyColor,
      lineHeight: 1.5,
      margin: [0, 1, 0, 1],
    },
    signatureBold: {
      fontSize: design.bodyFontSize,
      bold: true,
      color: design.primaryColor,
      margin: [0, 16, 0, 2],
    },
    signatureLine: {
      fontSize: design.bodyFontSize,
      color: design.bodyColor,
      margin: [0, 8, 0, 0],
    },
  }
}

export function buildDocumentDefinition(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contentElements: any[],
  design: DocumentDesign,
  options: {
    documentTitle: string
    logoDataUrl?: string | null
    signatureDataUrl?: string | null
  }
) {
  const showSignature = !!options.signatureDataUrl

  return {
    pageSize: "A4" as const,
    pageMargins: [design.marginLeft, design.marginTop, design.marginRight, design.marginBottom],

    background: (currentPage: number, pageSize: { width: number; height: number }) =>
      buildBackground(design, pageSize, options.logoDataUrl || undefined),

    header: (currentPage: number) =>
      buildHeader(design, currentPage, options.logoDataUrl || undefined),

    footer: (currentPage: number, pageCount: number) =>
      buildFooter(design, currentPage, pageCount),

    content: [
      { text: "", margin: [0, 0, 0, 40] },
      { text: options.documentTitle, style: "title" },
      ...contentElements,
      ...(showSignature
          ? [
              { text: "", margin: [0, 20, 0, 0] },
              { image: options.signatureDataUrl!, width: 130, margin: [0, 0, 0, 4] },
              { text: "Authorized Signature", fontSize: 10, bold: true, color: design.primaryColor, margin: [0, 0, 0, 2] },
              { text: design.companyName, fontSize: 10, color: design.bodyColor },
            ]
        : []),
    ],

    styles: buildStyles(design),

    defaultStyle: {
      font: "Roboto" as const,
    },
  }
}

export function requiresSignature(docType: string): boolean {
  const lower = docType.toLowerCase()
  if (lower.includes("payslip") || lower.includes("id card")) {
    return false
  }
  return true
}
