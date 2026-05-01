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

  const prompt = `You are a helpful health information assistant for a Bangladeshi audience.
A user has entered the medicine name: "${name.trim()}"

Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text):
{
  "name": "proper medicine name",
  "uses": "1-2 sentences on what this medicine is commonly used for",
  "sideEffects": ["side effect 1", "side effect 2", "side effect 3", "side effect 4"],
  "precautions": ["precaution 1", "precaution 2", "precaution 3"],
  "dietTip": "One practical tip about food or drink to avoid or prefer while taking this medicine",
  "found": true
}

If the input is not a recognisable medicine name, respond with:
{"found": false, "message": "Medicine not recognised. Please check the spelling."}

Keep language simple and clear. Do not give dosage advice.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "AI service error. Please try again." }, { status: 502 });
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "";

  try {
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Could not parse AI response." }, { status: 500 });
  }
}
