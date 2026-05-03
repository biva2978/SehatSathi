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

  const prompt = `You are a clinical health analyst AI for Bangladeshi users. Analyze the following patient data.

Patient:
- Age: ${age}, Gender: ${gender}
- Health conditions: ${conditions}
- Weight goal: ${goal}
- Daily food budget: ${budget === "low" ? "under ৳150/day" : budget === "medium" ? "৳150–300/day" : "৳300+/day"}
- Current medicines: ${medList}

Return a JSON object with exactly these fields. No markdown, no explanation, just the JSON:

{
  "interactions": [
    { "severity": "warning", "title": "Example interaction", "detail": "Details here" }
  ],
  "sideEffectsToWatch": ["nausea", "dizziness", "fatigue", "headache", "stomach upset"],
  "foodsToAvoid": [
    { "food": "Grapefruit", "reason": "Interferes with medicine absorption" }
  ],
  "foodsToEat": [
    { "food": "Dal (lentils)", "benefit": "High iron, good for anemia" }
  ],
  "lifestyleTips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4"],
  "urgentWarnings": [],
  "overallScore": { "score": 7, "label": "Good", "summary": "One sentence summary." }
}

Rules:
- severity must be exactly "warning" or "info"
- score must be a number between 1 and 10
- urgentWarnings must be an empty array [] if there are no serious concerns
- All foods must be specific to this patient's medicines and conditions
- foodsToEat must use affordable Bangladeshi foods only
- Be specific and practical, not generic`;

  const models = ["claude-sonnet-4-6", "claude-haiku-4-5-20251001"];
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
        max_tokens: 2000,
        system: "You are a JSON-only responder. Output ONLY a valid JSON object — no markdown, no code fences, no explanation. Start your response with { and end with }.",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (response.ok) break;
    lastStatus = response.status;
    const errText = await response.text().catch(() => "");
    console.error(`Claude API error (${model}):`, response.status, errText);
  }

  if (!response || !response.ok) {
    return NextResponse.json(
      { error: `AI service error (${lastStatus}). Please check your API key in Vercel settings and try again.` },
      { status: 502 }
    );
  }

  const data = await response.json();
  const rawText = data.content?.[0]?.text ?? "";

  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    // Validate required fields exist
    if (!parsed.overallScore || !Array.isArray(parsed.foodsToEat)) {
      throw new Error("Missing required fields");
    }
    return NextResponse.json(parsed);
  } catch {
    // Try extracting JSON from anywhere in the text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return NextResponse.json(JSON.parse(match[0]));
      } catch {
        // fall through
      }
    }
    return NextResponse.json({ error: "Analysis failed to parse. Please try again." }, { status: 500 });
  }
}
