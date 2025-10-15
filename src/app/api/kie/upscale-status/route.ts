import { NextResponse } from "next/server";

export const runtime = "nodejs";

function env(name: string) {
  return process.env[name];
}

export async function POST(req: Request) {
  try {
    const { taskId } = await req.json().catch(() => ({}));
    if (!taskId || typeof taskId !== "string") {
      return NextResponse.json({ ok: false, error: "Missing taskId" }, { status: 400 });
    }

    const KIE_API_KEY = env("KIE_API_KEY");
    const KIE_API_BASE = env("KIE_API_BASE") || "https://api.kie.ai";
    
    if (!KIE_API_KEY) {
      return NextResponse.json({ ok: false, error: "KIE_API_KEY not configured" }, { status: 500 });
    }

    // Call the KIE API to check task status
    const response = await fetch(`${KIE_API_BASE}/api/v1/jobs/getTaskResult?taskId=${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${KIE_API_KEY}`
      }
    });

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        ok: false, 
        error: `Status check failed: ${response.status}`,
        details: responseData
      }, { status: 502 });
    }

    // Parse the result to extract the upscaled image URL if available
    let resultUrls = [];
    if (responseData.data?.state === "success" && responseData.data?.resultJson) {
      try {
        const resultJson = JSON.parse(responseData.data.resultJson);
        resultUrls = resultJson.resultUrls || [];
      } catch (e) {
        console.error("Failed to parse resultJson:", e);
      }
    }

    return NextResponse.json({ 
      ok: true, 
      status: responseData.data?.state || "unknown",
      resultUrls,
      raw: responseData
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}
