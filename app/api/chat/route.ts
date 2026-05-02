import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { messages, profile } = await req.json();

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI service not configured." }, { status: 500 });

  const profileContext = profile
    ? `User profile: Age ${profile.age || "unknown"}, Gender ${profile.gender || "unknown"}, Height ${profile.height || "?"}cm, Weight ${profile.weight || "?"}kg, Health conditions: ${profile.conditions?.join(", ") || "none"}, Goal: ${profile.goal || "not set"}, Budget: ${profile.budget || "not set"}.`
    : "No profile available.";

  const system = `You are SehatSathi AI — a friendly, knowledgeable health assistant for Bangladeshi users. You speak clearly and practically.

${profileContext}

You can help with:
- Medicine information: uses, side effects, precautions, diet tips
- Personalised diet and nutrition advice using Bangladeshi foods
- Understanding health metrics (BMI, blood pressure, blood sugar etc.)
- General wellness, lifestyle, and fitness tips
- Interpreting symptoms and suggesting when to see a doctor

Rules:
- Always recommend consulting a doctor for diagnoses or prescriptions
- Keep responses concise — 2-4 short paragraphs max
- Use the user's profile context to personalise answers
- Suggest affordable, locally available Bangladeshi foods when relevant
- Be warm and encouraging`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      system,
      messages,
    }),
  });

  if (!response.ok) return NextResponse.json({ error: "AI service error. Please try again." }, { status: 502 });

  const data = await response.json();
  return NextResponse.json({ content: data.content?.[0]?.text ?? "" });
}
