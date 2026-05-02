import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { messages, profile, medicines } = await req.json();

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI service not configured." }, { status: 500 });

  const conditions = profile?.conditions?.join(", ") || "none";
  const medNames = medicines?.length
    ? medicines.map((m: { inputName: string; info?: { name: string } }) => m.info?.name ?? m.inputName).join(", ")
    : "none";

  const bmi =
    profile?.height && profile?.weight
      ? (parseFloat(profile.weight) / Math.pow(parseFloat(profile.height) / 100, 2)).toFixed(1)
      : null;

  const system = `You are SehatSathi AI — a smart, friendly health assistant built specifically for Bangladeshi users. You have full access to this user's health data.

USER DATA:
- Age: ${profile?.age || "unknown"}, Gender: ${profile?.gender || "unknown"}
- Height: ${profile?.height || "?"}cm, Weight: ${profile?.weight || "?"}kg${bmi ? `, BMI: ${bmi}` : ""}
- Health conditions: ${conditions}
- Weight goal: ${profile?.goal || "not set"}
- Food budget: ${profile?.budget === "low" ? "under ৳150/day" : profile?.budget === "medium" ? "৳150–300/day" : profile?.budget === "high" ? "৳300+/day" : "not set"}
- Current medicines: ${medNames}

YOUR CAPABILITIES:
1. Medicine analysis — explain uses, side effects, interactions between their specific medicines
2. Food & diet — recommend or warn about specific Bangladeshi foods based on their medicines and conditions
3. Health metrics — interpret their BMI, explain what it means for their goal
4. Symptom guidance — help understand symptoms and when to seek medical care
5. Lifestyle coaching — sleep, exercise, stress tips tailored to their conditions

RESPONSE STYLE:
- Be direct and specific — always reference their actual medicines/conditions by name
- Use simple language, avoid medical jargon
- Format with short paragraphs or bullet points when listing items
- Always end with a practical next step they can take today
- For serious symptoms, always say "Please see a doctor immediately"
- Keep responses under 200 words unless a detailed answer is genuinely needed`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system,
      messages,
    }),
  });

  if (!response.ok) return NextResponse.json({ error: "AI service error. Please try again." }, { status: 502 });

  const data = await response.json();
  return NextResponse.json({ content: data.content?.[0]?.text ?? "" });
}
