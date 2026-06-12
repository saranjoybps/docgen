import { NextRequest, NextResponse } from "next/server"
import { cloudinary } from "@/lib/cloudinary"
import { Readable } from "stream"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "company-signature",
          public_id: `signature_${Date.now()}`,
        },
        (error, result) => {
          if (error) reject(error)
          else resolve({ secure_url: result!.secure_url, public_id: result!.public_id })
        }
      )

      const readable = new Readable()
      readable.push(buffer)
      readable.push(null)
      readable.pipe(uploadStream)
    })

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    })
  } catch (error) {
    console.error("Signature upload error:", error)
    return NextResponse.json({ error: "Failed to upload signature" }, { status: 500 })
  }
}
