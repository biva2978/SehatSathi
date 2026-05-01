"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Disclaimer from "@/components/Disclaimer";

const HEALTH_TIPS = [
  "💧 Drink at least 8 glasses of water daily to support digestion and energy.",
  "🥗 Eat more leafy greens like spinach and shak — great for iron and energy.",
  "🚶 A 20-minute walk after lunch helps control blood sugar and aids digestion.",
  "🍋 Start your morning with warm lemon water to boost metabolism.",
  "🥚 Eggs are an affordable, complete protein — great for any budget.",
  "🌙 Try to sleep by 10pm — good sleep balances hormones and reduces cravings.",
  "🍌 Bananas are a great snack — they provide quick energy and potassium.",
  "🫁 Take 5 deep breaths when stressed — it lowers cortisol naturally.",
];

type Profile = {
  name: string;
  age: string;
  height: string;
  weight: string;
  goal: string;
  conditions: string[];
};

type Medicine = { id: string; info: { name: string } | null };
type Reminder = { id: string; active: boolean };

const GOAL_LABELS: Record<string, string> = {
  lose: "Lose Weight",
  maintain: "Maintain",
  gain: "Gain Weight",
};

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [tip, setTip] = useState("");

  useEffect(() => {
    const p = localStorage.getItem("sehatsathi_profile");
    if (p) setProfile(JSON.parse(p));
    const m = localStorage.getItem("sehatsathi_medicines");
    if (m) setMedicines(JSON.parse(m));
    const r = localStorage.getItem("sehatsathi_reminders");
    if (r) setReminders(JSON.parse(r));
    const idx = new Date().getDate() % HEALTH_TIPS.length;
    setTip(HEALTH_TIPS[idx]);
  }, []);

  const firstName = profile?.name?.split(" ")[0] ?? null;
  const activeReminders = reminders.filter((r) => r.active).length;

  const bmi =
    profile?.height && profile?.weight
      ? parseFloat(profile.weight) / Math.pow(parseFloat(profile.height) / 100, 2)
      : null;

  function bmiInfo(b: number) {
    if (b < 18.5) return { label: "Underweight", color: "text-blue-600", bar: "bg-blue-400", pct: 20 };
    if (b < 25)   return { label: "Normal",      color: "text-green-600", bar: "bg-green-400", pct: 50 };
    if (b < 30)   return { label: "Overweight",  color: "text-orange-500", bar: "bg-orange-400", pct: 72 };
    return              { label: "Obese",        color: "text-red-500",    bar: "bg-red-400", pct: 90 };
  }

  const isNewUser = !profile?.name;

  return (
    <div className="min-h-screen pb-28">
      <div className="bg-gradient-to-br from-green-500 to-teal-500 px-5 pt-12 pb-8 text-white">
        {firstName ? (
          <>
            <p className="text-green-100 text-sm font-medium mb-0.5">Good {getTimeOfDay()},</p>
            <h1 className="text-3xl font-bold tracking-tight">{firstName} 🌿</h1>
            <p className="text-green-100 mt-1 text-sm">Here is your health summary for today</p>
          </>
        ) : (
          <>
            <p className="text-green-100 text-sm font-medium mb-1">Welcome to</p>
            <h1 className="text-3xl font-bold tracking-tight">SehatSathi 🌿</h1>
            <p className="text-green-100 mt-1 text-sm">Your smart health &amp; diet companion</p>
          </>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 mt-5 space-y-4">
        <Disclaimer />

        {isNewUser && (
          <Link href="/profile" className="card border-2 border-dashed border-green-200 bg-green-50 flex items-center gap-3 hover:shadow-md transition-shadow">
            <span className="text-3xl">👋</span>
            <div>
              <p className="font-semibold text-green-800 text-sm">Set up your profile to get started</p>
              <p className="text-xs text-green-600 mt-0.5">Add your health conditions, goal &amp; budget →</p>
            </div>
          </Link>
        )}

        {!isNewUser && (
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon="💊" value={medicines.length.toString()} label="Medicines" href="/medicines" color="text-green-600" />
            <StatCard icon="⏰" value={activeReminders.toString()} label="Reminders" href="/reminders" color="text-blue-600" />
            <StatCard icon="🎯" value={profile?.goal ? GOAL_LABELS[profile.goal] ?? profile.goal : "—"} label="Goal" href="/profile" color="text-purple-600" small />
          </div>
        )}

        {bmi && (() => {
          const info = bmiInfo(bmi);
          return (
            <div className="card border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your BMI</p>
                <span className={`font-bold text-lg ${info.color}`}>{bmi.toFixed(1)} <span className="text-sm font-medium">— {info.label}</span></span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${info.bar} transition-all`} style={{ width: `${info.pct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-300 mt-1">
                <span>Under</span><span>Normal</span><span>Over</span><span>Obese</span>
              </div>
            </div>
          );
        })()}

        {profile?.conditions?.length ? (
          <div className="card border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Health Conditions</p>
            <div className="flex flex-wrap gap-2">
              {profile.conditions.map((c) => (
                <span key={c} className="bg-teal-50 text-teal-700 text-xs px-2.5 py-1 rounded-full font-medium">{c}</span>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">Quick Access</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/medicines", icon: "💊", title: "My Medicines",  desc: "Add & learn about medicines",     color: "bg-green-50 border-green-200"  },
              { href: "/diet",      icon: "🥗", title: "Diet Plan",     desc: "Get your Bangladeshi meal plan",  color: "bg-teal-50 border-teal-200"    },
              { href: "/reminders", icon: "⏰", title: "Reminders",     desc: "Medicine, meal & water alerts",   color: "bg-blue-50 border-blue-200"    },
              { href: "/profile",   icon: "👤", title: "My Profile",    desc: "Update your health info & goals", color: "bg-purple-50 border-purple-200" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className={`card border ${item.color} hover:shadow-md transition-shadow`}>
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="font-semibold text-sm text-gray-800">{item.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {tip && (
          <div className="card bg-gradient-to-r from-green-50 to-teal-50 border border-green-100">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Today&apos;s Health Tip</p>
            <p className="text-sm text-gray-700">{tip}</p>
          </div>
        )}
      </div>
      <Navbar />
    </div>
  );
}

function StatCard({ icon, value, label, href, color, small }: { icon: string; value: string; label: string; href: string; color: string; small?: boolean; }) {
  return (
    <Link href={href} className="card border border-gray-100 text-center hover:shadow-md transition-shadow py-3">
      <div className="text-xl mb-1">{icon}</div>
      <div className={`font-bold ${small ? "text-sm" : "text-xl"} ${color}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </Link>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
