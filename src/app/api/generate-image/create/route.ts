import { NextResponse } from "next/server";

export const runtime = "nodejs";

function env(name: string) {
  return process.env[name];
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const prompt = (form.get("prompt") as string) || "";
    const aspectRatio = (form.get("aspectRatio") as string) || "16:9";

    const KIE_API_KEY = env("KIE_API_KEY");
    const KIE_API_BASE = env("KIE_API_BASE") ?? "https://api.kie.ai";
    const MODEL = env("KIE_NANO_MODEL") ?? "google/nano-banana-edit";
    const EDIT_MODEL = env("KIE_NANO_EDIT_MODEL") ?? "google/nano-banana-edit";
    const CALLBACK = env("KIE_CALLBACK_URL");
    const KIE_UPLOAD_BASE = env("KIE_UPLOAD_BASE") ?? "https://kieai.redpandaai.co";

    // If no key, gracefully return the uploaded image preview so UI remains usable
    if (!KIE_API_KEY) {
      if (file instanceof File) {
        const arr = await file.arrayBuffer();
        const buf = Buffer.from(arr);
        const mime = file.type || "image/png";
        return NextResponse.json({ ok: true, imageUrl: `data:${mime};base64,${buf.toString("base64")}` });
      }
      return NextResponse.json({ ok: false, error: "KIE_API_KEY not configured" }, { status: 500 });
    }

    // Map aspect ratio to image_size or use auto
    const image_size = ["16:9", "9:16", "1:1"].includes(aspectRatio) ? aspectRatio : "auto";

    // Upload image to Kie to obtain a URL
    let uploadedUrl: string | undefined;
    if (file instanceof File) {
      // If HEIC/HEIF, convert to JPEG server-side using sharp
      let workingFile: File = file;
      const isHeic = /heic|heif/i.test(file.type || "") || /\.(heic|heif)$/i.test(file.name || "");
      if (isHeic) {
        try {
          const sharp = (await import("sharp")).default;
          const inputBuf = Buffer.from(await file.arrayBuffer());
          const outBuf = await sharp(inputBuf).jpeg({ quality: 90 }).toBuffer();
          const outName = (file.name || "upload").replace(/\.(heic|heif)$/i, ".jpg");
          workingFile = new File([outBuf], outName, { type: "image/jpeg" });
        } catch (err) {
          // If conversion fails (e.g. sharp not installed), return a clear error
          return NextResponse.json(
            { ok: false, error: "HEIC/HEIF conversion failed; please install sharp or upload PNG/JPG/WebP" },
            { status: 500 }
          );
        }
      }
      try {
        const fd = new FormData();
        fd.append("file", workingFile);
        fd.append("uploadPath", "ugc-factory");
        fd.append("fileName", workingFile.name);
        const upRes = await fetch(`${KIE_UPLOAD_BASE}/api/file-stream-upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${KIE_API_KEY}` },
          body: fd,
        });
        const upJson = await upRes.json();
        if (upRes.ok && (upJson?.success || upJson?.code === 200)) {
          uploadedUrl = upJson?.data?.fileUrl || upJson?.data?.url || upJson?.data?.downloadUrl;
        }
      } catch {}
      if (!uploadedUrl) {
        try {
          // Use the working file (possibly converted) for base64 upload
          const arr = await (workingFile as File).arrayBuffer();
          const b64 = Buffer.from(arr).toString("base64");
          const payload = {
            fileBase64: `data:${(workingFile as File).type || "image/png"};base64,${b64}`,
            uploadPath: "ugc-factory",
            fileName: (workingFile as File).name,
          };
          const upRes2 = await fetch(`${KIE_UPLOAD_BASE}/api/file-base64-upload`, {
            method: "POST",
            headers: { Authorization: `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const upJson2 = await upRes2.json();
          if (upRes2.ok && (upJson2?.success || upJson2?.code === 200)) {
            uploadedUrl = upJson2?.data?.fileUrl || upJson2?.data?.url || upJson2?.data?.downloadUrl;
          }
        } catch {}
      }
    }

    // Choose an edit model if a file is provided; fall back to MODEL otherwise
    const modelToUse = (file instanceof File)
      ? (EDIT_MODEL || (MODEL.endsWith("-edit") ? MODEL : `${MODEL}-edit`))
      : MODEL;

    // Simple heuristic: if prompt asks to remove background, pass an explicit flag if supported
    const removeBg = typeof prompt === "string" && /remove\s+the?\s*background/i.test(prompt);

    const payload = {
      model: modelToUse,
      callBackUrl: CALLBACK,
      input: {
        prompt,
        output_format: "png",
        image_size,
        ...(file instanceof File ? { task_type: "image_edit" as const } : {}),
        ...(removeBg ? { remove_background: true } : {}),
        ...(uploadedUrl ? { image_urls: [uploadedUrl] } : {}),
      },
    };

    // Server-side diagnostic (safe) logging
    try {
      console.debug("[KIE] createTask payload", {
        model: payload.model,
        hasCallback: Boolean(payload.callBackUrl),
        input: { ...payload.input, image_urls: payload.input?.image_urls ? ["<redacted>"] : undefined },
      });
    } catch {}

    const createRes = await fetch(`${KIE_API_BASE}/api/v1/jobs/createTask`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const createJson = await createRes.json().catch(() => ({}));
    try {
      console.debug("[KIE] createTask response", { status: createRes.status, ok: createRes.ok, body: createJson });
    } catch {}
    if (!createRes.ok || createJson?.code !== 200) {
      return NextResponse.json({ ok: false, error: `Create task failed: ${createJson?.msg || createRes.status}`, raw: createJson }, { status: 502 });
    }
    const taskId: string | undefined = createJson?.data?.taskId;
    if (!taskId) {
      return NextResponse.json({ ok: false, error: "Missing taskId in response", raw: createJson }, { status: 502 });
    }

    return NextResponse.json({ ok: true, taskId, uploadedUrl });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}
