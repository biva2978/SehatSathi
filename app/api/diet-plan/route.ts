import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { conditions, goal, budget, weight, height, gender, age } = await req.json();

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI service not configured." }, { status: 500 });

  const budgetLabel = budget === "low" ? "under ৳150 per day" : budget === "medium" ? "৳150–300 per day" : "৳300+ per day";
  const conditionList = conditions?.length > 0 ? conditions.join(", ") : "none specified";

  const prompt = `You are a nutrition expert specialising in Bangladeshi cuisine and affordable healthy eating.

User profile:
- Age: ${age || "not specified"}
- Gender: ${gender || "not specified"}
- Height: ${height ? height + " cm" : "not specified"}
- Weight: ${weight ? weight + " kg" : "not specified"}
- Health conditions: ${conditionList}
- Weight goal: ${goal || "maintain"}
- Daily food budget: ${budgetLabel}

Create a practical one-day Bangladeshi meal plan for this person. Use only locally available, affordable Bangladeshi foods (rice, dal, ruti, vegetables, fish, eggs, etc.).

Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text):
{
  "meals": {
    "earlyMorning": { "name": "Early Morning (6–7am)", "items": ["item 1", "item 2"], "tip": "short tip" },
    "breakfast": { "name": "Breakfast (8–9am)", "items": ["item 1", "item 2", "item 3"], "tip": "short tip" },
    "lunch": { "name": "Lunch (1–2pm)", "items": ["item 1", "item 2", "item 3", "item 4"], "tip": "short tip" },
    "snack": { "name": "Afternoon Snack (4–5pm)", "items": ["item 1", "item 2"], "tip": "short tip" },
    "dinner": { "name": "Dinner (8–9pm)", "items": ["item 1", "item 2", "item 3"], "tip": "short tip" }
  },
  "highlights": ["key benefit 1 for their condition", "key benefit 2", "key benefit 3"],
  "avoid": ["food to avoid 1 based on their condition", "food to avoid 2"],
  "waterTarget": "recommended daily water intake with reason"
}

Make it specific to their health conditions and budget. Keep items practical and easy to cook.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 900, messages: [{ role: "user", content: prompt }] }),
  });

  if (!response.ok) return NextResponse.json({ error: "AI service error. Please try again." }, { status: 502 });
  const data = await response.json();
  const text = data.content?.[0]?.text ?? "";
  try { return NextResponse.json(JSON.parse(text)); }
  catch { return NextResponse.json({ error: "Could not parse AI response." }, { status: 500 }); }
}
