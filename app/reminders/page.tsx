"use client";
import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { saveUserData, loadUserData } from "@/lib/firebase";

type ReminderType = "medicine" | "meal" | "water";
type Reminder = { id: string; type: ReminderType; label: string; time: string; days: string[]; active: boolean; };

const ALL_DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const TYPE_CONFIG: Record<ReminderType, { icon: string; color: string; bg: string; label: string }> = {
  medicine: { icon: "💊", color: "text-green-700", bg: "bg-green-50", label: "Medicine" },
  meal:     { icon: "🍽️", color: "text-teal-700",  bg: "bg-teal-50",  label: "Meal"     },
  water:    { icon: "💧", color: "text-blue-700",  bg: "bg-blue-50",  label: "Water"    },
};
const QUICK_REMINDERS = [
  { type: "medicine" as ReminderType, label: "Morning Medicine", time: "08:00" },
  { type: "medicine" as ReminderType, label: "Evening Medicine", time: "20:00" },
  { type: "meal"     as ReminderType, label: "Breakfast Time",   time: "08:30" },
  { type: "meal"     as ReminderType, label: "Lunch Time",       time: "13:00" },
  { type: "meal"     as ReminderType, label: "Dinner Time",      time: "20:30" },
  { type: "water"    as ReminderType, label: "Drink Water",      time: "10:00" },
];
const EMPTY_FORM = { type: "medicine" as ReminderType, label: "", time: "08:00", days: [...ALL_DAYS] };

export default function RemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [notifStatus, setNotifStatus] = useState<NotificationPermission | "unsupported">("default");
  const lastFiredRef = useRef<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      if (user) {
        const cloud = await loadUserData(user.uid, "reminders").catch(() => null);
        if (cloud?.list) { setReminders(cloud.list); localStorage.setItem("sehatsathi_reminders", JSON.stringify(cloud.list)); }
        else { const stored = localStorage.getItem("sehatsathi_reminders"); if (stored) setReminders(JSON.parse(stored)); }
      } else { const stored = localStorage.getItem("sehatsathi_reminders"); if (stored) setReminders(JSON.parse(stored)); }
      const fired = localStorage.getItem("sehatsathi_reminders_fired");
      if (fired) lastFiredRef.current = JSON.parse(fired);
      if (!("Notification" in window)) setNotifStatus("unsupported");
      else setNotifStatus(Notification.permission);
    }
    load();
  }, [user]);

  useEffect(() => { const interval = setInterval(checkReminders, 30_000); return () => clearInterval(interval); }, [reminders]);

  function checkReminders() {
    const now = new Date();
    const dayName = ALL_DAYS[now.getDay()];
    const hhmm = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    reminders.forEach((r) => {
      if (!r.active || !r.days.includes(dayName) || r.time !== hhmm) return;
      const fireKey = `${r.id}-${hhmm}`;
      if (lastFiredRef.current[r.id] === fireKey) return;
      lastFiredRef.current[r.id] = fireKey;
      localStorage.setItem("sehatsathi_reminders_fired", JSON.stringify(lastFiredRef.current));
      if (Notification.permission === "granted") new Notification(`${TYPE_CONFIG[r.type].icon} ${r.label}`, { body: `SehatSathi reminder — ${r.time}`, icon: "/favicon.ico" });
    });
  }

  async function requestPermission() { if (!("Notification" in window)) return; const result = await Notification.requestPermission(); setNotifStatus(result); }

  async function save(list: Reminder[]) {
    setReminders(list);
    localStorage.setItem("sehatsathi_reminders", JSON.stringify(list));
    if (user) await saveUserData(user.uid, "reminders", { list }).catch(() => null);
  }

  function addReminder() {
    if (!form.label.trim() || form.days.length === 0) return;
    save([{ id: Date.now().toString(), ...form, label: form.label.trim(), active: true }, ...reminders]);
    setForm(EMPTY_FORM); setShowForm(false);
  }

  function addQuick(q: (typeof QUICK_REMINDERS)[0]) {
    if (reminders.some((r) => r.label === q.label && r.time === q.time)) return;
    save([{ id: Date.now().toString(), type: q.type, label: q.label, time: q.time, days: [...ALL_DAYS], active: true }, ...reminders]);
  }

  function toggleActive(id: string) { save(reminders.map((r) => (r.id === id ? { ...r, active: !r.active } : r))); }
  function removeReminder(id: string) { save(reminders.filter((r) => r.id !== id)); }
  function toggleDay(day: string) { setForm((f) => ({ ...f, days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day] })); }

  const grouped = { medicine: reminders.filter((r) => r.type === "medicine"), meal: reminders.filter((r) => r.type === "meal"), water: reminders.filter((r) => r.type === "water") };

  return (
    <div className="min-h-screen pb-28">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-400 px-5 pt-12 pb-8 text-white">
        <h1 className="text-2xl font-bold">Reminders ⏰</h1>
        <p className="text-blue-100 text-sm mt-1">Medicine, meal &amp; water reminders</p>
      </div>
      <div className="max-w-lg mx-auto px-4 mt-5 space-y-4">
        {notifStatus === "default" && (
          <div className="card border border-blue-100 bg-blue-50 flex items-start gap-3">
            <span className="text-2xl mt-0.5">🔔</span>
            <div className="flex-1"><p className="font-semibold text-sm text-blue-800">Enable notifications</p><p className="text-xs text-blue-600 mt-0.5">Allow notifications so reminders pop up even when you are on another tab.</p></div>
            <button onClick={requestPermission} className="text-xs font-semibold text-white bg-blue-500 px-3 py-1.5 rounded-lg hover:bg-blue-600 transition whitespace-nowrap">Allow</button>
          </div>
        )}
        {notifStatus === "denied" && <div className="disclaimer">🔕 Notifications are blocked. Go to your browser settings to allow notifications for this site, then reload.</div>}
        {notifStatus === "granted" && <div className="card bg-green-50 border border-green-100 flex items-center gap-2 py-2.5"><span className="text-green-500">✅</span><p className="text-sm text-green-700 font-medium">Notifications are enabled — reminders will pop up on time.</p></div>}

        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Quick Add</h2>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_REMINDERS.map((q) => {
              const cfg = TYPE_CONFIG[q.type];
              const exists = reminders.some((r) => r.label === q.label && r.time === q.time);
              return (
                <button key={q.label} onClick={() => addQuick(q)} disabled={exists} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${exists ? "bg-gray-50 border-gray-100 text-gray-300 cursor-default" : `${cfg.bg} border-transparent hover:shadow-sm`}`}>
                  <span className="text-xl">{cfg.icon}</span>
                  <div><p className={`text-xs font-semibold ${exists ? "text-gray-300" : cfg.color}`}>{q.label}</p><p className="text-xs text-gray-400">{q.time}</p></div>
                  {exists && <span className="ml-auto text-green-400 text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {!showForm ? (
          <button onClick={() => setShowForm(true)} className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-400 transition">+ Add Custom Reminder</button>
        ) : (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Custom Reminder</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-xs hover:text-gray-600">Cancel</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TYPE_CONFIG) as ReminderType[]).map((t) => {
                const cfg = TYPE_CONFIG[t];
                return (<button key={t} onClick={() => setForm((f) => ({ ...f, type: t }))} className={`p-2.5 rounded-xl border text-center transition-all ${form.type === t ? `${cfg.bg} border-current ${cfg.color}` : "bg-white border-gray-200 text-gray-400"}`}><div className="text-xl">{cfg.icon}</div><div className="text-xs font-medium mt-0.5">{cfg.label}</div></button>);
              })}
            </div>
            <input type="text" placeholder='e.g. "Take Metformin" or "Drink Water"' value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <div><label className="block text-xs text-gray-500 mb-1">Time</label><input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" /></div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">Repeat on</label>
              <div className="flex gap-1.5 flex-wrap">
                {ALL_DAYS.map((d) => (<button key={d} onClick={() => toggleDay(d)} className={`w-9 h-9 rounded-full text-xs font-semibold border transition-all ${form.days.includes(d) ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-400 border-gray-200"}`}>{d}</button>))}
              </div>
            </div>
            <button onClick={addReminder} disabled={!form.label.trim() || form.days.length === 0} className="w-full btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: "#3b82f6" }}>Save Reminder</button>
          </div>
        )}

        {reminders.length === 0 ? (
          <div className="card text-center text-gray-400 py-10"><div className="text-4xl mb-2">⏰</div><p className="font-medium">No reminders yet</p><p className="text-sm mt-1">Use Quick Add above to get started</p></div>
        ) : (
          (Object.keys(grouped) as ReminderType[]).map((type) => {
            const list = grouped[type]; if (list.length === 0) return null;
            const cfg = TYPE_CONFIG[type];
            return (<div key={type} className="space-y-2"><h3 className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>{cfg.icon} {cfg.label} Reminders</h3>{list.map((r) => (<ReminderRow key={r.id} reminder={r} onToggle={() => toggleActive(r.id)} onRemove={() => removeReminder(r.id)} />))}</div>);
          })
        )}
      </div>
      <Navbar />
    </div>
  );
}

function ReminderRow({ reminder, onToggle, onRemove }: { reminder: Reminder; onToggle: () => void; onRemove: () => void; }) {
  const cfg = TYPE_CONFIG[reminder.type];
  return (
    <div className={`card border flex items-center gap-3 py-3 transition-opacity ${reminder.active ? "opacity-100" : "opacity-50"}`}>
      <span className="text-2xl">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-800 truncate">{reminder.label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{reminder.time} &nbsp;·&nbsp; {reminder.days.length === 7 ? "Every day" : reminder.days.join(", ")}</p>
      </div>
      <button onClick={onToggle} className={`relative w-11 h-6 rounded-full transition-colors ${reminder.active ? "bg-blue-500" : "bg-gray-200"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${reminder.active ? "translate-x-5" : "translate-x-0"}`} />
      </button>
      <button onClick={onRemove} className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded-lg hover:bg-red-50 transition">✕</button>
    </div>
  );
}
