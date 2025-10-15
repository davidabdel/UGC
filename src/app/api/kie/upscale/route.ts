import { NextResponse } from "next/server";

export const runtime = "nodejs";

function env(name: string) {
  return process.env[name];
}

// Helper function to proxy an image through our server to avoid CORS issues
async function proxyImageIfNeeded(imageUrl: string): Promise<string> {
  // If it's already a data URL, return it as is
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  try {
    // First, check if we need to proxy by attempting to use the KIE upload API
    const KIE_API_KEY = env("KIE_API_KEY");
    const KIE_UPLOAD_BASE = env("KIE_UPLOAD_BASE") || "https://kieai.redpandaai.co";
    
    if (!KIE_API_KEY) {
      throw new Error("KIE_API_KEY not configured");
    }

    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    // Get the image as a buffer
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // Convert to base64 for the upload
    const base64Data = `data:${contentType};base64,${Buffer.from(imageBuffer).toString('base64')}`;
    
    // Upload to KIE
    const uploadResponse = await fetch(`${KIE_UPLOAD_BASE}/api/file-base64-upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base64Data,
        uploadPath: "images/upscale-source",
        fileName: `source-${Date.now()}.jpg`,
      }),
    });

    const uploadData = await uploadResponse.json();
    
    if (!uploadResponse.ok || !(uploadData?.success || uploadData?.code === 200)) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    const uploadedUrl = uploadData?.data?.downloadUrl || uploadData?.data?.url;
    if (!uploadedUrl) {
      throw new Error("No downloadUrl in upload response");
    }

    return uploadedUrl;
  } catch (error) {
    console.error("Error proxying image:", error);
    // If proxying fails, return the original URL and let the API try to handle it
    return imageUrl;
  }
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

    // Proxy the image to avoid CORS issues
    const proxiedImageUrl = await proxyImageIfNeeded(imageUrl);

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
          image: proxiedImageUrl,
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
