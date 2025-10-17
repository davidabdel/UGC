import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    if (!url) {
      return new Response(JSON.stringify({ error: "url is required" }), { status: 400 });
    }

    const upstream = await fetch(url);
    if (!upstream.ok) {
      const j = await upstream.text().catch(() => "");
      return new Response(JSON.stringify({ ok: false, status: upstream.status, body: j }), { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const buf = await upstream.arrayBuffer();

    // Try to infer filename
    const nameFromUrl = url.split("/").pop() || "file";
    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(nameFromUrl)}`,
      "Cache-Control": "no-store",
    });

    return new Response(buf, { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: "proxy failed", details: String(e) }), { status: 500 });
  }
}
