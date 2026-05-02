import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { profile, medicines } = await req.json();

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI service not configured." }, { status: 500 });

  const medList = medicines?.length
    ? medicines.map((m: { inputName: string; info?: { name: string } }) => m.info?.name ?? m.inputName).join(", ")
    : "none";

  const conditions = profile?.conditions?.join(", ") || "none";
  const goal = profile?.goal || "maintain";
  const budget = profile?.budget || "low";
  const age = profile?.age || "unknown";
  const gender = profile?.gender || "unknown";

  const prompt = `You are a clinical health analyst AI for Bangladeshi users. Analyze the following patient data comprehensively.

Patient:
- Age: ${age}, Gender: ${gender}
- Health conditions: ${conditions}
- Weight goal: ${goal}
- Daily food budget: ${budget === "low" ? "under ৳150/day" : budget === "medium" ? "৳150–300/day" : "৳300+/day"}
- Current medicines: ${medList}

Perform a full health analysis. Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text):
{
  "interactions": [
    { "severity": "warning" | "info", "title": "short title", "detail": "explanation" }
  ],
  "sideEffectsToWatch": ["side effect 1", "side effect 2", "side effect 3", "side effect 4", "side effect 5"],
  "foodsToAvoid": [
    { "food": "food name", "reason": "why to avoid with these medicines/conditions" }
  ],
  "foodsToEat": [
    { "food": "Bangladeshi food name", "benefit": "specific benefit for their conditions" }
  ],
  "lifestyleTips": ["tip 1", "tip 2", "tip 3", "tip 4"],
  "urgentWarnings": ["warning if any — leave empty array if none"],
  "overallScore": { "score": 1-10, "label": "e.g. Good", "summary": "1 sentence overall assessment" }
}

Rules:
- foodsToAvoid and foodsToEat must be specific to their medicines AND conditions combined
- foodsToEat must use affordable, locally available Bangladeshi foods
- interactions should only list relevant drug-drug or drug-condition interactions
- urgentWarnings: only include if there is a genuinely serious concern
- Be specific and actionable, not generic`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) return NextResponse.json({ error: "AI service error. Please try again." }, { status: 502 });

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "";

  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json({ error: "Could not parse analysis. Please try again." }, { status: 500 });
  }
}
