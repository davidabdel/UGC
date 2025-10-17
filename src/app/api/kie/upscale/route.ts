import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.KIE_API_KEY || process.env.NEXT_PUBLIC_KIE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "KIE_API_KEY missing" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const image: unknown = body?.image;
    const scale: unknown = body?.scale;
    const face_enhance: unknown = body?.face_enhance;

    if (typeof image !== "string" || !image) {
      return NextResponse.json({ error: "image is required" }, { status: 400 });
    }
    const validScales = [2, 3, 4];
    if (typeof scale !== "number" || !validScales.includes(scale)) {
      return NextResponse.json({ error: "scale must be 2, 3, or 4" }, { status: 400 });
    }

    const res = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "nano-banana-upscale",
        callBackUrl: process.env.KIE_CALLBACK_URL || undefined,
        input: {
          image,
          scale,
          face_enhance: Boolean(face_enhance),
        },
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ ok: false, status: res.status, error: data }, { status: res.status });
    }
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected error", details: String(err) }, { status: 500 });
  }
}
