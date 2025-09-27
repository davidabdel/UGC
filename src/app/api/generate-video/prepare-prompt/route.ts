import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

function env(name: string) {
  return process.env[name];
}

function loadOpenAIKey() {
  let key = process.env.OPENAI_API_KEY || "";
  const candidates = [
    "/Users/davidabdel/Desktop/UGC_factory/web/.env.local",
    "/Users/davidabdel/Desktop/UGC_factory/web/.env",
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env"),
  ];
  for (const p of candidates) {
    if (key) break;
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf8");
        const lines = raw.split(/\r?\n/);
        const line = lines.find((l) => /^(?:export\s+)?OPENAI_API_KEY\s*=/.test(l.trim()) && !l.trim().startsWith("#"));
        if (line) {
          const m = line.trim().match(/^(?:export\s+)?OPENAI_API_KEY\s*=\s*(.*)$/);
          const val = m?.[1]?.trim();
          if (val) key = val.replace(/^['\"]|['\"]$/g, "");
        }
      }
    } catch {}
  }
  return key;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const videoPrompt: string = body?.videoPrompt || "";
    const dialogue: string = body?.dialogue || "";

    const OPENAI_API_KEY = loadOpenAIKey();
    const OPENAI_MODEL = env("OPENAI_MODEL") || "gpt-4o-mini";
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ ok: false, error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    const instruction = `Generate a video prompt for Gemini VEO3. I want the video to ${videoPrompt} and then have dialogue saying ${dialogue}`;

    // Keep the response strictly as a single line of prompt text.
    const input = [
      "System: You craft concise, production-ready prompts for Gemini VEO3.",
      "Constraint: Respond with ONLY the final prompt text. No preface, no quotes, no markdown.",
      `Task: ${instruction}`,
    ].join("\n");

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input,
        temperature: 0.7,
        max_output_tokens: 300,
      }),
    });

    const textBody = await res.text();
    let json: any = {};
    try { json = JSON.parse(textBody); } catch {}
    if (!res.ok) {
      const msg = json?.error?.message || json?.message || textBody || `OpenAI error ${res.status}`;
      return NextResponse.json({ ok: false, error: msg, raw: json || textBody }, { status: 502 });
    }

    let prompt: string | undefined = (json?.output_text || "").trim();
    if (!prompt && Array.isArray(json?.choices) && json.choices[0]?.message?.content) {
      prompt = String(json.choices[0].message.content).trim();
    }
    if (!prompt && Array.isArray(json?.output)) {
      try {
        const pieces: string[] = [];
        for (const item of json.output) {
          const content = item?.content;
          if (Array.isArray(content)) {
            for (const c of content) {
              if (typeof c?.text === "string") pieces.push(c.text);
              if (typeof c?.string_value === "string") pieces.push(c.string_value);
            }
          }
        }
        if (pieces.length) prompt = pieces.join(" ").trim();
      } catch {}
    }

    if (!prompt) {
      return NextResponse.json({ ok: false, error: "No prompt returned from OpenAI", raw: json }, { status: 502 });
    }

    return NextResponse.json({ ok: true, prompt });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}
