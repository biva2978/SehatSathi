"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Disclaimer from "@/components/Disclaimer";
import { useAuth } from "@/contexts/AuthContext";
import { saveUserData, loadUserData } from "@/lib/firebase";

type MedicineInfo = {
  name: string;
  uses: string;
  sideEffects: string[];
  precautions: string[];
  dietTip: string;
};

type Medicine = {
  id: string;
  inputName: string;
  frequency: string;
  info: MedicineInfo | null;
  addedAt: number;
};

type BulkStatus = { name: string; status: "pending" | "done" | "error"; message?: string };

const FREQ_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "As needed",
  "Before meals",
  "After meals",
];

export default function MedicinesPage() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [inputName, setInputName] = useState("");
  const [frequency, setFrequency] = useState("Once daily");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [bulkInput, setBulkInput] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkStatuses, setBulkStatuses] = useState<BulkStatus[]>([]);

  useEffect(() => {
    async function load() {
      if (user) {
        const cloud = await loadUserData(user.uid, "medicines").catch(() => null);
        if (cloud?.list) {
          setMedicines(cloud.list);
          localStorage.setItem("sehatsathi_medicines", JSON.stringify(cloud.list));
          return;
        }
      }
      const stored = localStorage.getItem("sehatsathi_medicines");
      if (stored) setMedicines(JSON.parse(stored));
    }
    load();
  }, [user]);

  async function saveMedicines(list: Medicine[]) {
    setMedicines(list);
    localStorage.setItem("sehatsathi_medicines", JSON.stringify(list));
    if (user) await saveUserData(user.uid, "medicines", { list }).catch(() => null);
  }

  async function handleAdd() {
    if (!inputName.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/medicine-info", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: inputName }) });
      const data = await res.json();
      if (data.found === false) { setError(data.message ?? "Medicine not recognised."); setLoading(false); return; }
      if (data.error) { setError(data.error); setLoading(false); return; }
      const newMed: Medicine = { id: Date.now().toString(), inputName: inputName.trim(), frequency, info: data as MedicineInfo, addedAt: Date.now() };
      await saveMedicines([newMed, ...medicines]);
      setExpanded(newMed.id); setInputName("");
    } catch { setError("Network error. Please check your connection."); }
    setLoading(false);
  }

  async function handleBulkAdd() {
    const names = bulkInput.split(/[\n,]+/).map((n) => n.trim()).filter((n) => n.length > 1);
    if (names.length === 0) return;
    setBulkLoading(true);
    setBulkStatuses(names.map((name) => ({ name, status: "pending" })));
    const results: Medicine[] = [];
    await Promise.all(
      names.map(async (name, idx) => {
        try {
          const res = await fetch("/api/medicine-info", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
          const data = await res.json();
          if (data.found === false || data.error) {
            setBulkStatuses((prev) => prev.map((s, i) => i === idx ? { ...s, status: "error", message: data.message ?? data.error ?? "Not recognised" } : s));
          } else {
            results.push({ id: (Date.now() + idx).toString(), inputName: name, frequency: "Once daily", info: data as MedicineInfo, addedAt: Date.now() });
            setBulkStatuses((prev) => prev.map((s, i) => i === idx ? { ...s, status: "done" } : s));
          }
        } catch {
          setBulkStatuses((prev) => prev.map((s, i) => i === idx ? { ...s, status: "error", message: "Network error" } : s));
        }
      })
    );
    if (results.length > 0) await saveMedicines([...results, ...medicines]);
    setBulkLoading(false);
    setBulkInput("");
  }

  function removeMedicine(id: string) {
    saveMedicines(medicines.filter((m) => m.id !== id));
    if (expanded === id) setExpanded(null);
  }

  return (
    <div className="min-h-screen pb-28">
      <div className="bg-gradient-to-br from-green-500 to-emerald-400 px-5 pt-12 pb-8 text-white">
        <h1 className="text-2xl font-bold">My Medicines 💊</h1>
        <p className="text-green-100 text-sm mt-1">Add medicines to learn about them</p>
      </div>
      <div className="max-w-lg mx-auto px-4 mt-5 space-y-4">
        <Disclaimer />
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Add Medicine</h2>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
              <button onClick={() => { setMode("single"); setBulkStatuses([]); }} className={`px-3 py-1.5 font-medium transition ${mode === "single" ? "bg-green-500 text-white" : "bg-white text-gray-500"}`}>Single</button>
              <button onClick={() => { setMode("bulk"); setError(""); }} className={`px-3 py-1.5 font-medium transition ${mode === "bulk" ? "bg-green-500 text-white" : "bg-white text-gray-500"}`}>Multiple</button>
            </div>
          </div>

          {mode === "single" ? (
            <>
              <input type="text" placeholder="e.g. Metformin, Folic Acid, Omeprazole" value={inputName} onChange={(e) => { setInputName(e.target.value); setError(""); }} onKeyDown={(e) => e.key === "Enter" && handleAdd()} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">How often?</label>
                <div className="flex flex-wrap gap-2">
                  {FREQ_OPTIONS.map((f) => (<button key={f} onClick={() => setFrequency(f)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${frequency === f ? "bg-green-500 text-white border-green-500" : "bg-white text-gray-500 border-gray-200 hover:border-green-300"}`}>{f}</button>))}
                </div>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <button onClick={handleAdd} disabled={loading || !inputName.trim()} className="w-full btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed">{loading ? "Looking up medicine…" : "Add Medicine"}</button>
              {loading && <p className="text-xs text-center text-gray-400">Fetching information from AI…</p>}
            </>
          ) : (
            <>
              <textarea placeholder={"Enter one medicine per line, or separate with commas:\nMetformin\nFolic Acid\nOmeprazole, Amlodipine"} value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none" />
              <button onClick={handleBulkAdd} disabled={bulkLoading || !bulkInput.trim()} className="w-full btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed">{bulkLoading ? "Looking up all medicines…" : "Add All Medicines"}</button>
              {bulkStatuses.length > 0 && (
                <div className="space-y-1.5">
                  {bulkStatuses.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {s.status === "pending" && <span className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-green-500 animate-spin flex-shrink-0" />}
                      {s.status === "done" && <span className="text-green-500 flex-shrink-0">✓</span>}
                      {s.status === "error" && <span className="text-red-400 flex-shrink-0">✕</span>}
                      <span className={s.status === "error" ? "text-red-500" : "text-gray-700"}>{s.name}</span>
                      {s.status === "error" && <span className="text-xs text-red-400">— {s.message}</span>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {medicines.length === 0 ? (
          <div className="card text-center text-gray-400 py-10"><div className="text-4xl mb-2">💊</div><p className="font-medium">No medicines added yet</p><p className="text-sm mt-1">Use Single or Multiple mode above to add</p></div>
        ) : (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-600 text-sm">My Medicines ({medicines.length})</h2>
            {medicines.map((med) => (<MedicineCard key={med.id} med={med} isExpanded={expanded === med.id} onToggle={() => setExpanded(expanded === med.id ? null : med.id)} onRemove={() => removeMedicine(med.id)} />))}
          </div>
        )}
      </div>
      <Navbar />
    </div>
  );
}

function MedicineCard({ med, isExpanded, onToggle, onRemove }: { med: Medicine; isExpanded: boolean; onToggle: () => void; onRemove: () => void; }) {
  return (
    <div className="card border border-gray-100">
      <div className="flex items-start justify-between gap-2">
        <button onClick={onToggle} className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💊</span>
            <div><p className="font-semibold text-gray-800 text-sm">{med.info?.name ?? med.inputName}</p><p className="text-xs text-gray-400 mt-0.5">{med.frequency}</p></div>
          </div>
        </button>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400">{isExpanded ? "▲" : "▼"}</span>
          <button onClick={onRemove} className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded-lg hover:bg-red-50 transition">Remove</button>
        </div>
      </div>
      {isExpanded && med.info && (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-3">
          <div><p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">What it&apos;s used for</p><p className="text-sm text-gray-700">{med.info.uses}</p></div>
          <div><p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Common Side Effects</p><ul className="space-y-1">{med.info.sideEffects.map((s, i) => (<li key={i} className="text-sm text-gray-600 flex gap-2"><span className="text-orange-400 mt-0.5">•</span>{s}</li>))}</ul></div>
          <div><p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Precautions</p><ul className="space-y-1">{med.info.precautions.map((p, i) => (<li key={i} className="text-sm text-gray-600 flex gap-2"><span className="text-blue-400 mt-0.5">✓</span>{p}</li>))}</ul></div>
          <div className="bg-green-50 rounded-xl px-3 py-2.5"><p className="text-xs font-semibold text-green-700 mb-1">🥗 Diet Tip</p><p className="text-sm text-gray-700">{med.info.dietTip}</p></div>
        </div>
      )}
    </div>
  );
}
