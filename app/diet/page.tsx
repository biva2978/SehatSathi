"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Disclaimer from "@/components/Disclaimer";
import { useAuth } from "@/contexts/AuthContext";
import { saveUserData, loadUserData } from "@/lib/firebase";

type Meal = {
  name: string;
  items: string[];
  tip: string;
};

type DietPlan = {
  meals: {
    earlyMorning: Meal;
    breakfast: Meal;
    lunch: Meal;
    snack: Meal;
    dinner: Meal;
  };
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

const GOAL_LABELS: Record<string, string> = {
  lose: "Weight Loss",
  maintain: "Maintain Weight",
  gain: "Weight Gain",
};

const BUDGET_LABELS: Record<string, string> = {
  low: "Low (under ৳150/day)",
  medium: "Medium (৳150–300/day)",
  high: "High (৳300+/day)",
};

export default function DietPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // Load profile
      const storedProfile = localStorage.getItem("sehatsathi_profile");
      if (storedProfile) setProfile(JSON.parse(storedProfile));

      // Load diet plan — try cloud first
      if (user) {
        const cloud = await loadUserData(user.uid, "diet_plan").catch(() => null);
        if (cloud?.plan) {
          setPlan(cloud.plan);
          setGeneratedAt(cloud.generatedAt ?? null);
          return;
        }
      }
      const cachedPlan = localStorage.getItem("sehatsathi_diet_plan");
      const cachedAt = localStorage.getItem("sehatsathi_diet_plan_at");
      if (cachedPlan) {
        setPlan(JSON.parse(cachedPlan));
        setGeneratedAt(cachedAt);
      }
    }
    load();
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
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      const now = new Date().toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
      setPlan(data);
      setGeneratedAt(now);
      localStorage.setItem("sehatsathi_diet_plan", JSON.stringify(data));
      localStorage.setItem("sehatsathi_diet_plan_at", now);
      if (user) {
        await saveUserData(user.uid, "diet_plan", { plan: data, generatedAt: now }).catch(() => null);
      }
    } catch {
      setError("Network error. Please check your connection.");
    }

    setLoading(false);
  }

  const hasProfile = profile && (profile.conditions?.length > 0 || profile.goal);

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 to-cyan-400 px-5 pt-12 pb-8 text-white">
        <h1 className="text-2xl font-bold">Diet Plan 🥗</h1>
        <p className="text-teal-100 text-sm mt-1">
          Personalised Bangladeshi meal suggestions
        </p>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-5 space-y-4">
        <Disclaimer />

        {/* Profile Summary Card */}
        <div className="card border border-teal-100">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">
            Your Plan Is Based On
          </h2>

          {hasProfile ? (
            <div className="space-y-2">
              {profile.conditions?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profile.conditions.map((c) => (
                    <span
                      key={c}
                      className="bg-teal-50 text-teal-700 text-xs px-2.5 py-1 rounded-full font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-4 text-sm text-gray-500">
                {profile.goal && (
                  <span>
                    🎯 {GOAL_LABELS[profile.goal] ?? profile.goal}
                  </span>
                )}
                {profile.budget && (
                  <span>
                    💰 {BUDGET_LABELS[profile.budget] ?? profile.budget}
                  </span>
                )}
              </div>
              {!profile.conditions?.length && !profile.goal && (
                <p className="text-sm text-gray-400">
                  No conditions or goal set — a general plan will be generated.
                </p>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-400 space-y-1">
              <p>No profile found.</p>
              <a href="/profile" className="text-teal-600 font-medium underline">
                Set up your profile first →
              </a>
            </div>
          )}

          <button
            onClick={generatePlan}
            disabled={loading}
            className="w-full btn-primary mt-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#26a69a" }}
          >
            {loading
              ? "Generating your plan…"
              : plan
              ? "Regenerate Plan"
              : "Generate My Meal Plan"}
          </button>

          {loading && (
            <p className="text-xs text-center text-gray-400 mt-1">
              AI is building your personalised Bangladeshi meal plan…
            </p>
          )}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mt-2">
              {error}
            </p>
          )}
          {generatedAt && !loading && (
            <p className="text-xs text-center text-gray-400 mt-1">
              Last generated: {generatedAt}
            </p>
          )}
        </div>

        {/* Meal Plan */}
        {plan && (
          <>
            {/* Highlights */}
            <div className="card bg-green-50 border border-green-100">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
                Why This Plan Works For You
              </p>
              <ul className="space-y-1.5">
                {plan.highlights.map((h, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            {/* Meals */}
            <div className="space-y-3">
              {Object.entries(plan.meals).map(([key, meal]) => (
                <MealCard key={key} icon={MEAL_ICONS[key] ?? "🍽️"} meal={meal} />
              ))}
            </div>

            {/* Water Target */}
            <div className="card bg-blue-50 border border-blue-100 flex gap-3 items-start">
              <span className="text-2xl">💧</span>
              <div>
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-0.5">
                  Water Target
                </p>
                <p className="text-sm text-gray-700">{plan.waterTarget}</p>
              </div>
            </div>

            {/* Foods to Avoid */}
            <div className="card bg-orange-50 border border-orange-100">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">
                Foods to Avoid
              </p>
              <ul className="space-y-1">
                {plan.avoid.map((a, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-orange-400 mt-0.5">✕</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
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
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <span className="font-semibold text-sm text-gray-800">
            {meal.name}
          </span>
        </div>
        <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
          <ul className="space-y-1">
            {meal.items.map((item, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-teal-400 mt-0.5">•</span>
                {item}
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
