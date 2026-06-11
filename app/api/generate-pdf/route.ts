import { NextRequest, NextResponse } from "next/server"
import React from "react"
import { Document, Page, View, Text, StyleSheet, renderToStream } from "@react-pdf/renderer"
import { cloudinary } from "@/lib/cloudinary"
import stream from "stream"

const NAVY = "#1e3a5f"
const BLUE = "#2563eb"
const LIGHT_BLUE = "#dbeafe"
const BG = "#f8fafc"
const BORDER = "#e2e8f0"
const MUTED = "#64748b"
const BODY = "#1e293b"

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  // ── Decorative top border band ──
  topBand1: {
    height: 4,
    backgroundColor: NAVY,
  },
  topBand2: {
    height: 2,
    backgroundColor: BLUE,
  },
  // ── Letterhead ──
  letterhead: {
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginBottom: 20,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: NAVY,
  },
  companyTagline: {
    fontSize: 8,
    color: MUTED,
    marginTop: 1,
  },
  docBadge: {
    backgroundColor: LIGHT_BLUE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  docBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
    color: BLUE,
  },
  // ── Body ──
  body: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: NAVY,
    marginBottom: 16,
    textAlign: "center",
  },
  // ── Content elements ──
  sectionHeader: {
    fontSize: 11,
    fontWeight: "bold",
    color: NAVY,
    marginTop: 14,
    marginBottom: 6,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: BLUE,
  },
  sectionCenter: {
    fontSize: 12,
    fontWeight: "bold",
    color: NAVY,
    marginTop: 14,
    marginBottom: 6,
    textAlign: "center",
  },
  line: {
    fontSize: 10,
    color: BODY,
    lineHeight: 1.8,
    marginBottom: 2,
  },
  boldLine: {
    fontSize: 10,
    color: BODY,
    lineHeight: 1.8,
    marginBottom: 2,
    fontWeight: "bold",
  },
  subjectLine: {
    fontSize: 10,
    fontWeight: "bold",
    color: NAVY,
    marginBottom: 10,
    marginTop: 4,
  },
  greeting: {
    fontSize: 10,
    color: BODY,
    lineHeight: 1.8,
    marginTop: 4,
  },
  signatureBlock: {
    marginTop: 20,
  },
  signatureLine: {
    fontSize: 10,
    color: BODY,
    lineHeight: 1.8,
    marginTop: 8,
  },
  signatureBold: {
    fontSize: 10,
    fontWeight: "bold",
    color: NAVY,
    lineHeight: 1.8,
    marginTop: 16,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginVertical: 10,
  },
  // ── Table ──
  tableContainer: {
    marginTop: 6,
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: NAVY,
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginTop: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableCell: {
    fontSize: 9,
    color: BODY,
    flex: 1,
  },
  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: MUTED,
  },
})

function parseAndRenderLines(lines: string[]) {
  const elements: React.ReactElement[] = []
  let inTable = false
  let tableRows: string[][] = []
  let tableHeaders: string[] = []

  function flushTable() {
    if (tableRows.length === 0) return
    elements.push(
      React.createElement(View, { key: `tbl-${elements.length}`, style: styles.tableContainer, wrap: false },
        tableHeaders.length > 0 &&
          React.createElement(View, { style: styles.tableHeader, wrap: false },
            ...tableHeaders.map((h, i) =>
              React.createElement(Text, { key: `th-${i}`, style: styles.tableHeaderCell }, h.trim())
            )
          ),
        ...tableRows.map((row, ri) =>
          React.createElement(View, {
            key: `tr-${ri}`,
            style: {
              ...styles.tableRow,
              backgroundColor: ri % 2 === 0 ? "#ffffff" : BG,
            },
            wrap: false,
          },
            ...row.map((cell, ci) =>
              React.createElement(Text, {
                key: `tc-${ci}`,
                style: ci === 0 ? { ...styles.tableCell, fontWeight: "bold" } : styles.tableCell,
              }, cell.trim())
            )
          )
        )
      )
    )
    tableRows = []
    tableHeaders = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ""

    if (!trimmed) {
      if (inTable) { flushTable(); inTable = false }
      continue
    }

    // ── Table detection ──
    if (trimmed.includes("|") && trimmed.split("|").length >= 3) {
      inTable = true
      const cells = trimmed.split("|").filter((c) => c.trim())
      if (nextLine.includes("|") && nextLine.split("|").length >= 3) {
        if (trimmed.includes("---") || trimmed.match(/[-:]+\|/)) {
          // skip separator rows like | --- | --- |
        } else if (tableHeaders.length === 0 && tableRows.length === 0) {
          tableHeaders = cells
        } else {
          tableRows.push(cells)
        }
      } else {
        tableRows.push(cells)
      }
      continue
    }

    if (inTable) { flushTable(); inTable = false }

    // ── Section headers ──
    if (/^[A-Z0-9][.)]\s+[A-Z]/.test(trimmed)) {
      elements.push(
        React.createElement(Text, { key: `sh-${i}`, style: styles.sectionHeader }, trimmed)
      )
      continue
    }

    // ── ALL CAPS line as centered header ──
    if (/^[A-Z\s]{3,}$/.test(trimmed) && trimmed.length > 10) {
      elements.push(
        React.createElement(Text, { key: `ch-${i}`, style: styles.sectionCenter }, trimmed)
      )
      continue
    }

    // ── Subject line ──
    if (trimmed.toLowerCase().startsWith("subject:")) {
      elements.push(
        React.createElement(Text, { key: `sub-${i}`, style: styles.subjectLine }, trimmed)
      )
      continue
    }

    // ── Greeting / opening ──
    if (/^(Dear|To,?)/i.test(trimmed)) {
      elements.push(
        React.createElement(Text, { key: `gr-${i}`, style: styles.greeting }, trimmed)
      )
      continue
    }

    // ── Dashed / underscore separator ──
    if (/_{3,}/.test(trimmed) || /-{3,}/.test(trimmed)) {
      elements.push(
        React.createElement(View, { key: `sep-${i}`, style: styles.separator })
      )
      continue
    }

    // ── Signature / closing ──
    if (/^(Sincerely|Yours|Best|Warm|Regards|Thanking|IN WITNESS)/i.test(trimmed) &&
        nextLine === "") {
      elements.push(
        React.createElement(Text, { key: `cl-${i}`, style: styles.signatureBold }, trimmed)
      )
      continue
    }

    if (trimmed.includes("_______________") || trimmed.includes("________")) {
      elements.push(
        React.createElement(Text, { key: `sg-${i}`, style: styles.signatureLine }, trimmed)
      )
      continue
    }

    // ── Name: Value pairs ──
    if (trimmed.includes(":") && !/^http/i.test(trimmed)) {
      const parts = trimmed.split(":")
      if (parts[0].trim().length < 30) {
        elements.push(
          React.createElement(Text, { key: `nv-${i}`, style: styles.line },
            React.createElement(Text, { style: { fontWeight: "bold" } }, parts[0] + ":"),
            parts.slice(1).join(":")
          )
        )
        continue
      }
    }

    // ── Default body text ──
    elements.push(
      React.createElement(Text, { key: `ln-${i}`, style: styles.line }, trimmed)
    )
  }

  if (inTable) flushTable()
  return elements
}

function createPDFDocument(content: string, type: string, employeeName: string) {
  const lines = content.split("\n")
  const bodyElements = parseAndRenderLines(lines)
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      // ── Top decorative bands ──
      React.createElement(View, { style: styles.topBand1 }),
      React.createElement(View, { style: styles.topBand2 }),
      // ── Letterhead ──
      React.createElement(View, { style: styles.letterhead },
        React.createElement(View, null,
          React.createElement(Text, { style: styles.companyName }, "DOCUMENTS MANAGEMENT"),
          React.createElement(Text, { style: styles.companyTagline }, "Official Document"),
        ),
        React.createElement(View, { style: styles.docBadge },
          React.createElement(Text, { style: styles.docBadgeText }, type.toUpperCase())
        ),
      ),
      // ── Body ──
      React.createElement(View, { style: styles.body },
        React.createElement(Text, { style: styles.title }, type),
        ...bodyElements,
      ),
      // ── Footer ──
      React.createElement(View, { style: styles.footer },
        React.createElement(Text, { style: styles.footerText }, employeeName),
        React.createElement(Text, { style: styles.footerText }, `${today}`),
      ),
    ),
  )
}

export async function POST(request: NextRequest) {
  try {
    const { content, type, employeeName } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const doc = createPDFDocument(content, type || "Document", employeeName || "Employee")
    const pdfStream = await renderToStream(doc)
    const chunks: Buffer[] = []
    for await (const chunk of pdfStream) {
      chunks.push(Buffer.from(chunk))
    }
    const pdfBuffer = Buffer.concat(chunks)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "generated-documents",
          public_id: `${type}_${(employeeName || "doc").replace(/\s+/g, "_")}_${Date.now()}`,
          resource_type: "raw",
          format: "pdf",
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )

      const readable = new stream.PassThrough()
      readable.end(pdfBuffer)
      readable.pipe(uploadStream)
    })

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    })
  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    )
  }
}
