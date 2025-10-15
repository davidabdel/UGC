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

    // Call the KIE API to check task status with error handling
    try {
      const response = await fetch(`${KIE_API_BASE}/api/v1/jobs/getTaskResult?taskId=${taskId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${KIE_API_KEY}`
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000)
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("Status check error:", responseData);
        return NextResponse.json({ 
          ok: false, 
          error: `Status check failed: ${response.status}`,
          details: responseData
        }, { status: response.status });
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
    } catch (fetchError) {
      console.error("Fetch error during status check:", fetchError);
      return NextResponse.json({ 
        ok: false, 
        error: `Error checking status: ${fetchError.message}`,
        retryable: true
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error("General error in upscale-status endpoint:", err);
    return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}
