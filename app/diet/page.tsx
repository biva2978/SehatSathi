"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Disclaimer from "@/components/Disclaimer";
import { useAuth } from "@/contexts/AuthContext";
import { saveUserData, loadUserData } from "@/lib/firebase";

type Meal = {
  name: string;
  items: string[];
  calories: number;
  tip: string;
};

type DayPlan = {
  day: string;
  totalCalories: number;
  meals: {
    earlyMorning: Meal;
    breakfast: Meal;
    lunch: Meal;
    snack: Meal;
    dinner: Meal;
  };
};

type WeeklyDietPlan = {
  nutritionTargets: {
    dailyCalories: number;
    protein: string;
    carbs: string;
    fat: string;
    rationale: string;
  };
  weeklyPlan: DayPlan[];
  shoppingList: { item: string; quantity: string; approxCost: string }[];
  medicineNotes: string[];
  highlights: string[];
  avoid: string[];
  waterTarget: string;
};

type Profile = {
  name: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  goal: string;
  budget: string;
  conditions: string[];
};

const MEAL_ICONS: Record<string, string> = {
  earlyMorning: "🌅",
  breakfast: "🍳",
  lunch: "🍚",
  snack: "🥜",
  dinner: "🌙",
};

const DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_SHORT = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

export default function DietPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [medicines, setMedicines] = useState<Record<string, unknown>[]>([]);
  const [plan, setPlan] = useState<WeeklyDietPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [activeTab, setActiveTab] = useState<"plan" | "shopping" | "notes">("plan");

  useEffect(() => {
    const storedProfile = localStorage.getItem("sehatsathi_profile");
    if (storedProfile) setProfile(JSON.parse(storedProfile));
    const storedMeds = localStorage.getItem("sehatsathi_medicines");
    if (storedMeds) setMedicines(JSON.parse(storedMeds));

    async function loadPlan() {
      if (user) {
        const cloud = await loadUserData(user.uid, "diet_plan").catch(() => null);
        if (cloud?.plan) {
          setPlan(cloud.plan);
          setGeneratedAt(cloud.generatedAt ?? null);
          return;
        }
      }
      const cached = localStorage.getItem("sehatsathi_diet_plan");
      const cachedAt = localStorage.getItem("sehatsathi_diet_plan_at");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.weeklyPlan) {
            setPlan(parsed);
            setGeneratedAt(cachedAt);
          }
        } catch { /* ignore old format */ }
      }
    }
    loadPlan();
  }, [user]);

  async function generatePlan() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/diet-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conditions: profile?.conditions ?? [],
          goal: profile?.goal ?? "maintain",
          budget: profile?.budget ?? "low",
          weight: profile?.weight ?? "",
          height: profile?.height ?? "",
          gender: profile?.gender ?? "",
          age: profile?.age ?? "",
          medicines,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      const now = new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      setPlan(data);
      setGeneratedAt(now);
      setSelectedDay(0);
      setActiveTab("plan");
      localStorage.setItem("sehatsathi_diet_plan", JSON.stringify(data));
      localStorage.setItem("sehatsathi_diet_plan_at", now);
      if (user) await saveUserData(user.uid, "diet_plan", { plan: data, generatedAt: now }).catch(() => null);
    } catch {
      setError("Network error. Please check your connection.");
    }
    setLoading(false);
  }

  const dayPlan = plan?.weeklyPlan?.[selectedDay];
  const caloriePercent = dayPlan && plan?.nutritionTargets?.dailyCalories
    ? Math.min(100, Math.round((dayPlan.totalCalories / plan.nutritionTargets.dailyCalories) * 100))
    : 0;

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 to-cyan-400 px-5 pt-12 pb-5 text-white">
        <h1 className="text-2xl font-bold">Diet Plan 🥗</h1>
        <p className="text-teal-100 text-sm mt-1">7-day personalised Bangladeshi meal plan</p>

        {plan && (
          <div className="flex gap-2 mt-4">
            {(["plan", "shopping", "notes"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${activeTab === t ? "bg-white text-teal-600" : "bg-white/20 text-white"}`}
              >
                {t === "plan" ? "📅 Meal Plan" : t === "shopping" ? "🛒 Shopping List" : "💊 Medicine Notes"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        <Disclaimer />

        {/* Profile + Generate */}
        <div className="card border border-teal-100">
          {profile?.conditions?.length || profile?.goal ? (
            <div className="flex flex-wrap gap-2 items-center mb-3">
              {profile.conditions?.map((c) => (
                <span key={c} className="bg-teal-50 text-teal-700 text-xs px-2.5 py-1 rounded-full font-medium">{c}</span>
              ))}
              {profile.goal && <span className="text-xs text-gray-500">🎯 {profile.goal === "lose" ? "Weight loss" : profile.goal === "gain" ? "Weight gain" : "Maintain"}</span>}
              {profile.budget && <span className="text-xs text-gray-500">💰 {profile.budget === "low" ? "Under ৳150/day" : profile.budget === "medium" ? "৳150–300/day" : "৳300+/day"}</span>}
              {medicines.length > 0 && <span className="text-xs text-purple-600">💊 {medicines.length} medicine{medicines.length > 1 ? "s" : ""}</span>}
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-3">
              No profile set. <a href="/profile" className="text-teal-600 underline">Set up profile →</a>
            </p>
          )}

          <button
            onClick={generatePlan}
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm transition disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)" }}
          >
            {loading ? "Building your 7-day plan…" : plan ? "🔄 Regenerate Plan" : "🥗 Generate My 7-Day Plan"}
          </button>

          {loading && (
            <div className="mt-3 space-y-2">
              <div className="flex justify-center gap-1">
                <span className="w-2.5 h-2.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2.5 h-2.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2.5 h-2.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <p className="text-xs text-center text-gray-400">
                AI is building your personalised plan — analysing your conditions, medicines &amp; budget…
              </p>
            </div>
          )}
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mt-2">{error}</p>}
          {generatedAt && !loading && <p className="text-xs text-center text-gray-400 mt-2">Last generated: {generatedAt}</p>}
        </div>

        {/* Empty state */}
        {!plan && !loading && (
          <div className="card text-center py-10 space-y-2">
            <div className="text-4xl">🥗</div>
            <p className="font-semibold text-gray-700">Get your 7-day meal plan</p>
            <p className="text-sm text-gray-400">
              The AI will create a full week of Bangladeshi meals tailored to your conditions, medicines, and budget — with calorie targets and a shopping list.
            </p>
          </div>
        )}

        {plan && activeTab === "plan" && (
          <>
            {/* Nutrition Targets */}
            {plan.nutritionTargets && (
              <div className="card border border-teal-100 bg-teal-50">
                <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">Daily Nutrition Targets</p>
                <div className="grid grid-cols-3 gap-3 mb-2">
                  <div className="text-center">
                    <p className="text-xl font-bold text-teal-700">{plan.nutritionTargets.dailyCalories}</p>
                    <p className="text-xs text-gray-500">kcal/day</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-purple-600">{plan.nutritionTargets.protein}</p>
                    <p className="text-xs text-gray-500">Protein</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-orange-500">{plan.nutritionTargets.carbs}</p>
                    <p className="text-xs text-gray-500">Carbs</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600">{plan.nutritionTargets.rationale}</p>
              </div>
            )}

            {/* Why this plan */}
            {plan.highlights?.length > 0 && (
              <div className="card bg-green-50 border border-green-100">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Why This Plan Works For You</p>
                <ul className="space-y-1.5">
                  {plan.highlights.map((h, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>{h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Day selector */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Select Day</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {DAYS.map((day, i) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(i)}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      selectedDay === i
                        ? "bg-teal-500 text-white shadow-sm"
                        : "bg-white border border-gray-200 text-gray-500 hover:border-teal-300"
                    }`}
                  >
                    {DAY_SHORT[i]}
                  </button>
                ))}
              </div>
            </div>

            {/* Day calorie bar */}
            {dayPlan && (
              <div className="card border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-800 text-sm">{dayPlan.day}</p>
                  <span className="text-sm font-bold text-teal-600">{dayPlan.totalCalories} kcal</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-400 transition-all"
                    style={{ width: `${caloriePercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{caloriePercent}% of daily target</p>
              </div>
            )}

            {/* Meals */}
            {dayPlan && (
              <div className="space-y-3">
                {(Object.entries(dayPlan.meals) as [string, Meal][]).map(([key, meal]) => (
                  <MealCard key={key} icon={MEAL_ICONS[key] ?? "🍽️"} meal={meal} />
                ))}
              </div>
            )}

            {/* Water + Avoid */}
            {plan.waterTarget && (
              <div className="card bg-blue-50 border border-blue-100 flex gap-3 items-start">
                <span className="text-2xl">💧</span>
                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-0.5">Water Target</p>
                  <p className="text-sm text-gray-700">{plan.waterTarget}</p>
                </div>
              </div>
            )}

            {plan.avoid?.length > 0 && (
              <div className="card bg-orange-50 border border-orange-100">
                <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">🚫 Foods to Avoid</p>
                <ul className="space-y-1.5">
                  {plan.avoid.map((a, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-orange-400 mt-0.5 flex-shrink-0">✕</span>{a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-center text-gray-400 pb-2">
              ⚠️ AI-generated plan. Consult your doctor or nutritionist before major diet changes.
            </p>
          </>
        )}

        {/* Shopping List Tab */}
        {plan && activeTab === "shopping" && (
          <>
            <div className="card border border-teal-100">
              <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-3">🛒 Weekly Shopping List</p>
              {plan.shoppingList?.length > 0 ? (
                <div className="space-y-2">
                  {plan.shoppingList.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.item}</p>
                        <p className="text-xs text-gray-400">{item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold text-teal-600">{item.approxCost}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 mt-1 border-t border-teal-100">
                    <p className="text-sm font-semibold text-gray-700">Estimated Total</p>
                    <p className="text-sm font-bold text-teal-700">
                      {plan.shoppingList.reduce((sum, item) => {
                        const num = parseInt(item.approxCost.replace(/[^\d]/g, "") || "0");
                        return sum + num;
                      }, 0)} ৳ / week
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Shopping list not available. Try regenerating the plan.</p>
              )}
            </div>
            <p className="text-xs text-center text-gray-400 pb-2">
              Prices are approximate and may vary by location and season.
            </p>
          </>
        )}

        {/* Medicine Notes Tab */}
        {plan && activeTab === "notes" && (
          <>
            {plan.medicineNotes?.length > 0 ? (
              <div className="card border border-purple-100 bg-purple-50">
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-3">💊 Medicine &amp; Food Notes</p>
                <ul className="space-y-3">
                  {plan.medicineNotes.map((note, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-purple-400 mt-0.5 flex-shrink-0">•</span>{note}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="card text-center py-8 space-y-2">
                <div className="text-3xl">💊</div>
                <p className="text-sm text-gray-500">No medicine notes for this plan.</p>
                <p className="text-xs text-gray-400">Add medicines on the Medicines page for personalised notes.</p>
              </div>
            )}

            {plan.avoid?.length > 0 && (
              <div className="card bg-orange-50 border border-orange-100">
                <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">🚫 Foods to Avoid</p>
                <ul className="space-y-1.5">
                  {plan.avoid.map((a, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-orange-400 mt-0.5 flex-shrink-0">✕</span>{a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      <Navbar />
    </div>
  );
}

function MealCard({ icon, meal }: { icon: string; meal: Meal }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="card border border-gray-100">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div className="text-left">
            <p className="font-semibold text-sm text-gray-800">{meal.name}</p>
            {meal.calories > 0 && (
              <p className="text-xs text-teal-600 font-medium">{meal.calories} kcal</p>
            )}
          </div>
        </div>
        <span className="text-gray-400 text-xs flex-shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
          <ul className="space-y-1.5">
            {meal.items.map((item, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-teal-400 mt-0.5 flex-shrink-0">•</span>{item}
              </li>
            ))}
          </ul>
          {meal.tip && (
            <p className="text-xs text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg">
              💡 {meal.tip}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
