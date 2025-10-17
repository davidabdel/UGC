import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.KIE_API_KEY || process.env.NEXT_PUBLIC_KIE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "KIE_API_KEY missing" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const video: unknown = body?.video;
    const resolution: unknown = body?.resolution;

    if (typeof video !== "string" || !video) {
      return NextResponse.json({ error: "video is required" }, { status: 400 });
    }
    
    const validResolutions = ["720p", "1080p", "2k", "4k"];
    if (typeof resolution !== "string" || !validResolutions.includes(resolution)) {
      return NextResponse.json({ error: "resolution must be 720p, 1080p, 2k, or 4k" }, { status: 400 });
    }

    // Convert resolution to scale factor for the API
    const resolutionToScale: Record<string, number> = {
      "720p": 1,
      "1080p": 2,
      "2k": 3,
      "4k": 4
    };

    const scale = resolutionToScale[resolution];

    const res = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "nano-banana-video-upscale", // Assuming this is the model name for video upscaling
        callBackUrl: process.env.KIE_CALLBACK_URL || undefined,
        input: {
          video,
          scale,
          resolution
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
