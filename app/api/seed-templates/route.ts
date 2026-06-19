import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function GET() {
  try {
    const snapshot = await adminDb.collection("document_templates").get()
    const templates = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    const seedDir = path.join(process.cwd(), "seed")
    await mkdir(seedDir, { recursive: true })
    const seedPath = path.join(seedDir, "templates.json")
    await writeFile(seedPath, JSON.stringify(templates, null, 2), "utf-8")
    return NextResponse.json({ success: true, count: templates.length, path: seedPath })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
