import { NextRequest, NextResponse } from "next/server"
import React from "react"
import { Document, Page, View, Text, StyleSheet, renderToStream } from "@react-pdf/renderer"
import { cloudinary } from "@/lib/cloudinary"
import stream from "stream"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: "Helvetica",
  },
  content: {
    lineHeight: 1.6,
  },
})

function createPDFDocument(content: string) {
  const lines = content.split("\n")

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(
        View,
        { style: styles.content },
        ...lines.map((line, i) =>
          React.createElement(Text, { key: i }, line || " ")
        )
      )
    )
  )
}

export async function POST(request: NextRequest) {
  try {
    const { content, type, employeeName } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const doc = createPDFDocument(content)
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
