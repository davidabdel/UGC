import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.KIE_API_KEY || process.env.NEXT_PUBLIC_KIE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "KIE_API_KEY missing" }, { status: 500 });
    }
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    // Use KIE recordInfo endpoint per spec
    const getJson = async (method: 'GET' | 'POST', url: string, body?: any) => {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
        },
        body: method === 'POST' ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, json } as const;
    };

    const urlRecordInfo = `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`;
    // Try GET, then POST fallback
    let recordResp = await getJson('GET', urlRecordInfo);
    if (!recordResp.ok || (typeof recordResp.json?.code === 'number' && recordResp.json.code !== 200)) {
      const postTry = await getJson('POST', 'https://api.kie.ai/api/v1/jobs/recordInfo', { taskId });
      if (postTry.ok) recordResp = postTry;
    }

    if (!recordResp.ok) {
      return NextResponse.json({ ok: false, status: recordResp.status, error: recordResp.json }, { status: recordResp.status });
    }

    const combined: any = { primary: recordResp.json };

    // Best-effort URL extraction for convenience
    try {
      // If server provides a JSON string field resultJson, parse it
      const tryParseResultJson = (obj: any) => {
        const rj = obj?.data?.resultJson;
        if (typeof rj === 'string' && rj.trim().startsWith('{')) {
          try {
            return JSON.parse(rj);
          } catch {}
        }
        return undefined;
      };
      const rjPrimary = tryParseResultJson(combined.primary);
      if (rjPrimary) combined.primary.parsedResultJson = rjPrimary;

      const text = JSON.stringify(combined);
      const m = text.match(/https?:\/\/[^"\s]+tempfile\.aiquickdraw\.com[^"\s]+\.(?:png|jpg|jpeg|webp)/i);
      if (m && !combined.url) combined.url = m[0].replace(/\\\//g, '/');
    } catch {}

    // Normalize bestUrl and state for convenience
    const state = combined?.primary?.data?.state || combined?.primary?.state;
    const bestUrl = combined.url || combined?.primary?.parsedResultJson?.resultUrls?.[0];

    return NextResponse.json({ ok: true, data: { bestUrl, state, primary: combined.primary } });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected error", details: String(err) }, { status: 500 });
  }
}
