import { NextResponse } from "next/server";

export const runtime = "nodejs";

function env(name: string) {
  return process.env[name];
}

export async function POST(req: Request) {
  try {
    const { imageUrl, scale, faceEnhance } = await req.json().catch(() => ({}));
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ ok: false, error: "Missing imageUrl" }, { status: 400 });
    }

    // Validate scale parameter
    const scaleValue = Number(scale) || 2;
    if (![1, 2, 3, 4].includes(scaleValue)) {
      return NextResponse.json({ ok: false, error: "Scale must be 1, 2, 3, or 4" }, { status: 400 });
    }

    const KIE_API_KEY = env("KIE_API_KEY");
    const KIE_API_BASE = env("KIE_API_BASE") || "https://api.kie.ai";
    
    if (!KIE_API_KEY) {
      return NextResponse.json({ ok: false, error: "KIE_API_KEY not configured" }, { status: 500 });
    }

    // Call the KIE upscale API
    const response = await fetch(`${KIE_API_BASE}/api/v1/jobs/createTask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${KIE_API_KEY}`
      },
      body: JSON.stringify({
        model: "nano-banana-upscale",
        input: {
          image: imageUrl,
          scale: scaleValue,
          face_enhance: !!faceEnhance
        }
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        ok: false, 
        error: `Upscale API request failed: ${response.status}`,
        details: responseData
      }, { status: 502 });
    }

    return NextResponse.json({ 
      ok: true, 
      taskId: responseData.data?.taskId,
      message: "Upscale task created successfully",
      raw: responseData
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}
