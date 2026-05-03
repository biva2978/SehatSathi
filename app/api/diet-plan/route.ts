import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { conditions, goal, budget, weight, height, gender, age, medicines } =
    await req.json();

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI service not configured." },
      { status: 500 }
    );
  }

  const budgetLabel =
    budget === "low"
      ? "under ৳150 per day"
      : budget === "medium"
      ? "৳150–300 per day"
      : "৳300+ per day";

  const conditionList =
    conditions?.length > 0 ? conditions.join(", ") : "none";

  const medNames =
    medicines?.length > 0
      ? medicines
          .map(
            (m: { inputName: string; info?: { name: string } }) =>
              m.info?.name ?? m.inputName
          )
          .join(", ")
      : "none";

  const bmi =
    height && weight
      ? (parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1)
      : null;

  const prompt = `You are a clinical nutritionist specialising in Bangladeshi diets and managing chronic health conditions through food. Create a detailed, evidence-based 7-day meal plan.

PATIENT PROFILE:
- Age: ${age || "not specified"}, Gender: ${gender || "not specified"}
- Height: ${height ? height + " cm" : "?"}${bmi ? `, Weight: ${weight} kg, BMI: ${bmi}` : ""}
- Health conditions: ${conditionList}
- Weight goal: ${goal === "lose" ? "Weight loss" : goal === "gain" ? "Weight gain" : "Maintain weight"}
- Daily food budget: ${budgetLabel}
- Current medicines: ${medNames}

Create a 7-day meal plan that:
1. Uses ONLY affordable, locally available Bangladeshi foods
2. Considers medicine-food interactions for their specific medicines
3. Is tailored to their exact health conditions
4. Fits within their budget
5. Includes realistic calorie estimates

Return ONLY a valid JSON object with this exact structure. No markdown, no explanation:

{
  "nutritionTargets": {
    "dailyCalories": 1800,
    "protein": "60-80g",
    "carbs": "220-250g",
    "fat": "50-60g",
    "rationale": "One sentence explaining why these targets suit their goal and conditions."
  },
  "weeklyPlan": [
    {
      "day": "Saturday",
      "totalCalories": 1750,
      "meals": {
        "earlyMorning": { "name": "Early Morning (6–7am)", "items": ["item with portion", "item with portion"], "calories": 60, "tip": "short actionable tip" },
        "breakfast": { "name": "Breakfast (8–9am)", "items": ["item with portion", "item", "item"], "calories": 380, "tip": "short tip" },
        "lunch": { "name": "Lunch (1–2pm)", "items": ["item", "item", "item", "item"], "calories": 620, "tip": "short tip" },
        "snack": { "name": "Snack (4–5pm)", "items": ["item", "item"], "calories": 180, "tip": "short tip" },
        "dinner": { "name": "Dinner (8–9pm)", "items": ["item", "item", "item"], "calories": 510, "tip": "short tip" }
      }
    },
    { "day": "Sunday", "totalCalories": 1800, "meals": { "earlyMorning": { "name": "Early Morning (6–7am)", "items": ["item", "item"], "calories": 70, "tip": "tip" }, "breakfast": { "name": "Breakfast (8–9am)", "items": ["item", "item", "item"], "calories": 400, "tip": "tip" }, "lunch": { "name": "Lunch (1–2pm)", "items": ["item", "item", "item", "item"], "calories": 630, "tip": "tip" }, "snack": { "name": "Snack (4–5pm)", "items": ["item", "item"], "calories": 190, "tip": "tip" }, "dinner": { "name": "Dinner (8–9pm)", "items": ["item", "item", "item"], "calories": 510, "tip": "tip" } } },
    { "day": "Monday", "totalCalories": 1780, "meals": { "earlyMorning": { "name": "Early Morning (6–7am)", "items": ["item", "item"], "calories": 65, "tip": "tip" }, "breakfast": { "name": "Breakfast (8–9am)", "items": ["item", "item", "item"], "calories": 390, "tip": "tip" }, "lunch": { "name": "Lunch (1–2pm)", "items": ["item", "item", "item", "item"], "calories": 615, "tip": "tip" }, "snack": { "name": "Snack (4–5pm)", "items": ["item", "item"], "calories": 185, "tip": "tip" }, "dinner": { "name": "Dinner (8–9pm)", "items": ["item", "item", "item"], "calories": 525, "tip": "tip" } } },
    { "day": "Tuesday", "totalCalories": 1760, "meals": { "earlyMorning": { "name": "Early Morning (6–7am)", "items": ["item", "item"], "calories": 60, "tip": "tip" }, "breakfast": { "name": "Breakfast (8–9am)", "items": ["item", "item", "item"], "calories": 375, "tip": "tip" }, "lunch": { "name": "Lunch (1–2pm)", "items": ["item", "item", "item", "item"], "calories": 605, "tip": "tip" }, "snack": { "name": "Snack (4–5pm)", "items": ["item", "item"], "calories": 195, "tip": "tip" }, "dinner": { "name": "Dinner (8–9pm)", "items": ["item", "item", "item"], "calories": 525, "tip": "tip" } } },
    { "day": "Wednesday", "totalCalories": 1790, "meals": { "earlyMorning": { "name": "Early Morning (6–7am)", "items": ["item", "item"], "calories": 70, "tip": "tip" }, "breakfast": { "name": "Breakfast (8–9am)", "items": ["item", "item", "item"], "calories": 395, "tip": "tip" }, "lunch": { "name": "Lunch (1–2pm)", "items": ["item", "item", "item", "item"], "calories": 620, "tip": "tip" }, "snack": { "name": "Snack (4–5pm)", "items": ["item", "item"], "calories": 180, "tip": "tip" }, "dinner": { "name": "Dinner (8–9pm)", "items": ["item", "item", "item"], "calories": 525, "tip": "tip" } } },
    { "day": "Thursday", "totalCalories": 1770, "meals": { "earlyMorning": { "name": "Early Morning (6–7am)", "items": ["item", "item"], "calories": 65, "tip": "tip" }, "breakfast": { "name": "Breakfast (8–9am)", "items": ["item", "item", "item"], "calories": 385, "tip": "tip" }, "lunch": { "name": "Lunch (1–2pm)", "items": ["item", "item", "item", "item"], "calories": 610, "tip": "tip" }, "snack": { "name": "Snack (4–5pm)", "items": ["item", "item"], "calories": 185, "tip": "tip" }, "dinner": { "name": "Dinner (8–9pm)", "items": ["item", "item", "item"], "calories": 525, "tip": "tip" } } },
    { "day": "Friday", "totalCalories": 1850, "meals": { "earlyMorning": { "name": "Early Morning (6–7am)", "items": ["item", "item"], "calories": 75, "tip": "tip" }, "breakfast": { "name": "Breakfast (8–9am)", "items": ["item", "item", "item"], "calories": 420, "tip": "tip" }, "lunch": { "name": "Lunch (1–2pm)", "items": ["item", "item", "item", "item"], "calories": 650, "tip": "tip" }, "snack": { "name": "Snack (4–5pm)", "items": ["item", "item"], "calories": 195, "tip": "tip" }, "dinner": { "name": "Dinner (8–9pm)", "items": ["item", "item", "item"], "calories": 510, "tip": "tip" } } }
  ],
  "shoppingList": [
    { "item": "Rice (chinigura or regular)", "quantity": "2 kg", "approxCost": "৳100" },
    { "item": "Masoor dal", "quantity": "500g", "approxCost": "৳60" },
    { "item": "Eggs", "quantity": "12", "approxCost": "৳120" },
    { "item": "Rui/Catla fish", "quantity": "500g", "approxCost": "৳120" },
    { "item": "Seasonal vegetables", "quantity": "1 kg mixed", "approxCost": "৳60" }
  ],
  "medicineNotes": [
    "Note about timing of medicine X with meals",
    "Food interaction to know about medicine Y"
  ],
  "highlights": [
    "Key benefit 1 specific to their condition",
    "Key benefit 2",
    "Key benefit 3"
  ],
  "avoid": [
    "Specific food to avoid — reason tied to their condition/medicines",
    "Another food to avoid"
  ],
  "waterTarget": "8 glasses (2 litres) per day — important because of [their condition/medicine]"
}

CRITICAL RULES:
- Replace all placeholder "item" text with REAL, SPECIFIC Bangladeshi foods with portion sizes (e.g. "1 cup cooked rice (200g)", "2 medium ruti", "1 piece fried hilsa fish")
- weeklyPlan MUST have exactly 7 days: Saturday, Sunday, Monday, Tuesday, Wednesday, Thursday, Friday
- Each day's meals must be different from other days — real variety
- All calories must be realistic numbers, not zeroes
- shoppingList must have 8-12 items covering the full week at their budget
- medicineNotes must be specific to "${medNames}" — if no medicines, use empty array []
- All foods must be affordable and available in Bangladesh`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 5000,
      system: "You are a JSON-only responder. Output ONLY a valid JSON object — no markdown, no code fences, no explanation. Start your response with { and end with }.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error("Claude API error:", response.status, errText);
    return NextResponse.json(
      { error: `AI service error (${response.status}). Please check your API key and try again.` },
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
    if (!parsed.weeklyPlan || !Array.isArray(parsed.weeklyPlan)) {
      throw new Error("Missing weeklyPlan");
    }
    return NextResponse.json(parsed);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return NextResponse.json(JSON.parse(match[0]));
      } catch {
        // fall through
      }
    }
    return NextResponse.json(
      { error: "Diet plan failed to generate. Please try again." },
      { status: 500 }
    );
  }
}
