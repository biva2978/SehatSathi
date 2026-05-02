import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { messages, profile, medicines } = await req.json();

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI service not configured." }, { status: 500 });

  const profileContext = profile
    ? `Age ${profile.age || "?"}, Gender ${profile.gender || "?"}, Height ${profile.height || "?"}cm, Weight ${profile.weight || "?"}kg, Conditions: ${profile.conditions?.join(", ") || "none"}, Goal: ${profile.goal || "not set"}, Budget: ${profile.budget || "not set"}.`
    : "No profile set.";

  const medContext = medicines?.length
    ? medicines.map((m: { inputName: string; info?: { name: string } }) => m.info?.name ?? m.inputName).join(", ")
    : "none";

  const system = `You are SehatSathi AI — a friendly, expert health assistant for Bangladeshi users.

User profile: ${profileContext}
Current medicines: ${medContext}

You can help with:
- Medicine side effects, interactions, and precautions
- Personalised diet advice using Bangladeshi foods
- Understanding health metrics (BMI, blood pressure, blood sugar)
- General wellness, fitness, and lifestyle tips
- Interpreting symptoms and when to see a doctor

Rules:
- Always recommend consulting a doctor for diagnoses or prescriptions
- Keep responses concise — 2-4 short paragraphs max
- Reference the user's specific medicines and conditions when relevant
- Suggest affordable, locally available Bangladeshi foods
- Be warm, clear, and encouraging`;

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
