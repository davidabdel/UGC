import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.WAVESPEED_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "WAVESPEED_API_KEY missing" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const video: unknown = body?.video;
    const resolution: unknown = body?.resolution;
    const copyAudio: unknown = body?.copyAudio ?? true;

    if (typeof video !== "string" || !video) {
      return NextResponse.json({ error: "video is required" }, { status: 400 });
    }
    
    const validResolutions = ["720p", "1080p", "2k", "4k"];
    if (typeof resolution !== "string" || !validResolutions.includes(resolution)) {
      return NextResponse.json({ error: "resolution must be 720p, 1080p, 2k, or 4k" }, { status: 400 });
    }

    const url = "https://api.wavespeed.ai/api/v3/wavespeed-ai/video-upscaler";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    };
    
    const payload = {
      "copy_audio": Boolean(copyAudio),
      "target_resolution": resolution,
      "video": video
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      return NextResponse.json({ 
        ok: false, 
        status: response.status, 
        error: data 
      }, { status: response.status });
    }
    
    const requestId = data?.data?.id;
    
    if (!requestId) {
      return NextResponse.json({ 
        ok: false, 
        error: "No request ID returned from API" 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      ok: true, 
      data: {
        taskId: requestId,
        message: "Video upscale task created successfully"
      }
    });
  } catch (err) {
    return NextResponse.json({ 
      error: "Unexpected error", 
      details: String(err) 
    }, { status: 500 });
  }
}
