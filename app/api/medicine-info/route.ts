import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { name } = await req.json();

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Medicine name is required." }, { status: 400 });
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI service not configured." }, { status: 500 });
  }

  const prompt = `A user has entered the medicine name: "${name.trim()}"

If this is a recognisable medicine (including brand names common in Bangladesh like Normens, Neogest, Progut, Angenta, Filwel, Elgox, Rivotril, Bilastin, Domperidone, etc.), return:
{
  "name": "proper medicine name",
  "uses": "1-2 sentences on what this medicine is used for",
  "sideEffects": ["side effect 1", "side effect 2", "side effect 3", "side effect 4"],
  "precautions": ["precaution 1", "precaution 2", "precaution 3"],
  "dietTip": "One practical tip about food or drink to avoid or prefer while taking this medicine",
  "found": true
}

If the input is not a recognisable medicine name, return:
{"found": false, "message": "Medicine not recognised. Please check the spelling."}

Keep language simple. Do not give dosage advice. Output ONLY the JSON object.`;

  const models = ["claude-haiku-4-5-20251001", "claude-sonnet-4-6"];
  let response: Response | null = null;
  let lastStatus = 0;

  for (const model of models) {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        system: "You are a JSON-only responder. Output ONLY a valid JSON object — no markdown, no code fences, no explanation.",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (response.ok) break;
    lastStatus = response.status;
    const errText = await response.text().catch(() => "");
    console.error(`Medicine info error (${model}):`, response.status, errText);
  }

  if (!response || !response.ok) {
    return NextResponse.json(
      { error: `AI service error (${lastStatus}). Please check your API key in Vercel settings.` },
      { status: 502 }
    );
  }

  const data = await response.json();
  const rawText = (data.content?.[0]?.text ?? "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return NextResponse.json(JSON.parse(rawText));
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return NextResponse.json(JSON.parse(match[0]));
      } catch { /* fall through */ }
    }
    return NextResponse.json({ error: "Could not parse AI response. Please try again." }, { status: 500 });
  }
}
