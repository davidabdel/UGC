import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.WAVESPEED_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "WAVESPEED_API_KEY missing" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    
    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const url = `https://api.wavespeed.ai/api/v3/predictions/${taskId}/result`;
    const headers = {
      "Authorization": `Bearer ${apiKey}`
    };

    const response = await fetch(url, {
      headers: headers
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json({ 
        ok: false, 
        status: response.status, 
        error: result 
      }, { status: response.status });
    }

    const data = result.data;
    const status = data.status;
    let resultUrl = null;

    if (status === "completed" && data.outputs && data.outputs.length > 0) {
      resultUrl = data.outputs[0];
    }

    return NextResponse.json({ 
      ok: true, 
      data: {
        status: status,
        resultUrl: resultUrl,
        error: status === "failed" ? data.error : null,
        raw: data
      }
    });
  } catch (err) {
    return NextResponse.json({ 
      error: "Unexpected error", 
      details: String(err) 
    }, { status: 500 });
  }
}
