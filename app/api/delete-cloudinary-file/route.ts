import { NextRequest, NextResponse } from "next/server"
import { cloudinary } from "@/lib/cloudinary"

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const publicId = searchParams.get("publicId")

    if (!publicId) {
      return NextResponse.json({ error: "publicId is required" }, { status: 400 })
    }

    const result = await cloudinary.uploader.destroy(publicId, { resource_type: "raw" })

    if (result.result === "ok" || result.result === "not found") {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Failed to delete from Cloudinary" }, { status: 500 })
  } catch (error) {
    console.error("Cloudinary delete error:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}
