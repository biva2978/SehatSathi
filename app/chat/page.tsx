"use client";
import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";

type Message = { role: "user" | "assistant"; content: string };

type Analysis = {
  interactions: { severity: "warning" | "info"; title: string; detail: string }[];
  sideEffectsToWatch: string[];
  foodsToAvoid: { food: string; reason: string }[];
  foodsToEat: { food: string; benefit: string }[];
  lifestyleTips: string[];
  urgentWarnings: string[];
  overallScore: { score: number; label: string; summary: string };
};

const SUGGESTIONS = [
  "Are my medicines safe to take together?",
  "What foods are good for PCOS?",
  "How to lower blood pressure naturally?",
  "What is a good diet for diabetes?",
  "Explain my BMI and what I should do",
  "Best high-protein Bangladeshi foods?",
];

const DEEP_CONSULT_TEMPLATE = `My current weight is [XX] kg
Height: [X feet X inches]
Health conditions: [e.g. PCOS, migraine, diabetes]
Lab values: [e.g. IgE 690, SGPT 16, HbA1c 7.2]

Ongoing medicines:
- [Medicine name] [dose] [timing e.g. 1+0+1]
- [Medicine name] [dose] [timing]

My goal: [e.g. gain weight / lose weight / reduce pain / more energy]

Please analyse my medicines, explain diet interactions, and build a full Bangladeshi diet chart for me.`;

// ── Inline markdown renderer ──────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (/^\[[^\]]+\]\([^)]+\)$/.test(part))
      return <span key={i}>{(part.match(/^\[([^\]]+)\]/) ?? [])[1] ?? part}</span>;
    return <span key={i}>{part}</span>;
  });
}

function MarkdownMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      nodes.push(
        <p key={i} className="font-bold text-sm mt-3 mb-1 text-gray-900">
          {renderInline(line.slice(3))}
        </p>
      );
    } else if (line.startsWith("### ")) {
      nodes.push(
        <p key={i} className="font-semibold text-sm mt-2 mb-0.5 text-violet-700">
          {renderInline(line.slice(4))}
        </p>
      );
    } else if (line.startsWith("#### ")) {
      nodes.push(
        <p key={i} className="font-semibold text-xs mt-1.5 text-gray-700">
          {renderInline(line.slice(5))}
        </p>
      );
    } else if (line === "---") {
      nodes.push(<hr key={i} className="my-2 border-gray-200" />);
    } else if (/^[-*] /.test(line)) {
      nodes.push(
        <div key={i} className="flex gap-1.5 my-0.5 text-sm">
          <span className="text-violet-400 mt-0.5 flex-shrink-0">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\. /.test(line)) {
      const num = (line.match(/^(\d+)\./) ?? [])[1] ?? "";
      nodes.push(
        <div key={i} className="flex gap-1.5 my-0.5 text-sm">
          <span className="text-violet-500 font-semibold min-w-[18px]">{num}.</span>
          <span>{renderInline(line.replace(/^\d+\. /, ""))}</span>
        </div>
      );
    } else if (line.trim() === "") {
      nodes.push(<div key={i} className="h-1.5" />);
    } else {
      nodes.push(
        <p key={i} className="text-sm leading-relaxed my-0.5">
          {renderInline(line)}
        </p>
      );
    }
  }

  return <div>{nodes}</div>;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [tab, setTab] = useState<"chat" | "analysis">("analysis");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [medicines, setMedicines] = useState<Record<string, unknown>[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [showDeepPrompt, setShowDeepPrompt] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const p = localStorage.getItem("sehatsathi_profile");
    if (p) setProfile(JSON.parse(p));
    const m = localStorage.getItem("sehatsathi_medicines");
    if (m) setMedicines(JSON.parse(m));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  async function runAnalysis() {
    setAnalyzing(true);
    setAnalysisError("");
    setAnalysis(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, medicines }),
      });
      const data = await res.json();
      if (data.error) setAnalysisError(data.error);
      else setAnalysis(data);
    } catch {
      setAnalysisError("Network error. Please try again.");
    }
    setAnalyzing(false);
  }

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setTab("chat");
    setShowDeepPrompt(false);
    const userMsg: Message = { role: "user", content: text.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, profile, medicines }),
      });
      const data = await res.json();
      setMessages([...updated, {
        role: "assistant",
        content: data.error ? "Sorry, I couldn't process that. Please try again." : data.content,
      }]);
    } catch {
      setMessages([...updated, { role: "assistant", content: "Network error. Please check your connection." }]);
    }
    setLoading(false);
  }

  const scoreColor = (s: number) =>
    s >= 8 ? "text-green-600" : s >= 6 ? "text-teal-600" : s >= 4 ? "text-orange-500" : "text-red-500";
  const scoreBar = (s: number) =>
    s >= 8 ? "bg-green-400" : s >= 6 ? "bg-teal-400" : s >= 4 ? "bg-orange-400" : "bg-red-400";

  return (
    <div className="min-h-screen pb-28 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-500 to-purple-500 px-5 pt-12 pb-5 text-white">
        <h1 className="text-2xl font-bold">AI Health Agent 🤖</h1>
        <p className="text-violet-100 text-sm mt-1">Deep medicine analysis &amp; personalised health chat</p>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setTab("analysis")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${tab === "analysis" ? "bg-white text-violet-600" : "bg-white/20 text-white"}`}
          >
            🔬 Analysis
          </button>
          <button
            onClick={() => setTab("chat")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${tab === "chat" ? "bg-white text-violet-600" : "bg-white/20 text-white"}`}
          >
            💬 Chat
          </button>
        </div>
      </div>

      {/* ── ANALYSIS TAB ── */}
      {tab === "analysis" && (
        <div className="max-w-lg mx-auto w-full px-4 mt-4 pb-6 space-y-4">
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm transition disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
          >
            {analyzing ? "Analysing your health data…" : analysis ? "🔄 Re-run Analysis" : "🔬 Analyse My Health Now"}
          </button>

          {analyzing && (
            <div className="card text-center py-8 space-y-3">
              <div className="flex justify-center gap-1">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-3 h-3 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
              <p className="text-sm text-gray-500">AI is analysing your medicines, conditions &amp; diet…</p>
            </div>
          )}

          {analysisError && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{analysisError}</p>
          )}

          {!analysis && !analyzing && !analysisError && (
            <div className="card text-center py-10 space-y-2">
              <div className="text-4xl">🔬</div>
              <p className="font-semibold text-gray-700">Run your health analysis</p>
              <p className="text-sm text-gray-400">
                The AI will analyse all your medicines, health conditions, and goals to give a personalised report.
              </p>
              {medicines.length === 0 && (
                <p className="text-xs text-orange-500 bg-orange-50 px-3 py-2 rounded-lg mt-2">
                  Tip: Add medicines on the Medicines page for a fuller analysis.
                </p>
              )}
            </div>
          )}

          {analysis && (
            <>
              <div className="card border border-violet-100 bg-violet-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Overall Health Score</p>
                  <span className={`font-bold text-2xl ${scoreColor(analysis.overallScore.score)}`}>
                    {analysis.overallScore.score}/10
                    <span className="text-sm font-medium ml-1">— {analysis.overallScore.label}</span>
                  </span>
                </div>
                <div className="h-2 bg-violet-100 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${scoreBar(analysis.overallScore.score)} transition-all`} style={{ width: `${analysis.overallScore.score * 10}%` }} />
                </div>
                <p className="text-sm text-gray-600">{analysis.overallScore.summary}</p>
              </div>

              {analysis.urgentWarnings.length > 0 && (
                <div className="card border border-red-200 bg-red-50">
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">⚠️ Urgent Warnings</p>
                  <ul className="space-y-1">
                    {analysis.urgentWarnings.map((w, i) => (
                      <li key={i} className="text-sm text-red-700 flex gap-2">
                        <span className="mt-0.5 flex-shrink-0">🚨</span>{w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.interactions.length > 0 && (
                <div className="card space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">💊 Medicine Interactions</p>
                  {analysis.interactions.map((item, i) => (
                    <div key={i} className={`rounded-xl px-3 py-2.5 ${item.severity === "warning" ? "bg-orange-50 border border-orange-100" : "bg-blue-50 border border-blue-100"}`}>
                      <p className={`text-xs font-semibold mb-0.5 ${item.severity === "warning" ? "text-orange-700" : "text-blue-700"}`}>
                        {item.severity === "warning" ? "⚠️" : "ℹ️"} {item.title}
                      </p>
                      <p className="text-xs text-gray-600">{item.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="card space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">👁️ Side Effects to Watch</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.sideEffectsToWatch.map((s, i) => (
                    <span key={i} className="bg-orange-50 text-orange-700 text-xs px-2.5 py-1 rounded-full border border-orange-100">{s}</span>
                  ))}
                </div>
              </div>

              <div className="card space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">🚫 Foods to Avoid</p>
                <ul className="space-y-2">
                  {analysis.foodsToAvoid.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span>
                      <div>
                        <span className="text-sm font-medium text-gray-800">{item.food}</span>
                        <span className="text-xs text-gray-400 ml-1">— {item.reason}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">✅ Recommended Foods</p>
                <ul className="space-y-2">
                  {analysis.foodsToEat.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                      <div>
                        <span className="text-sm font-medium text-gray-800">{item.food}</span>
                        <span className="text-xs text-gray-400 ml-1">— {item.benefit}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">💡 Lifestyle Tips</p>
                <ul className="space-y-2">
                  {analysis.lifestyleTips.map((tip, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-violet-400 mt-0.5 flex-shrink-0">•</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-center text-gray-400 pb-2">
                ⚠️ AI-generated. Always consult your doctor before making health decisions.
              </p>
            </>
          )}
        </div>
      )}

      {/* ── CHAT TAB ── */}
      {tab === "chat" && (
        <div className="flex-1 max-w-lg mx-auto w-full px-4 mt-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="space-y-3">
              <div className="card bg-violet-50 border border-violet-100 flex gap-3 items-start">
                <span className="text-2xl">🤖</span>
                <div>
                  <p className="font-semibold text-violet-800 text-sm">I know your medicines &amp; health profile</p>
                  <p className="text-xs text-violet-600 mt-0.5">
                    Ask me anything — or share your full medical details for a deep personalised analysis + diet chart.
                  </p>
                </div>
              </div>

              {/* Deep consult CTA */}
              <button
                onClick={() => setShowDeepPrompt((v) => !v)}
                className="w-full text-left px-4 py-3 rounded-xl border-2 border-dashed border-violet-300 bg-violet-50 hover:bg-violet-100 transition"
              >
                <p className="text-sm font-semibold text-violet-700">🔍 Deep Health Consult</p>
                <p className="text-xs text-violet-500 mt-0.5">
                  Share your weight, conditions, lab values &amp; medicines — get full medicine analysis + Bangladeshi diet chart
                </p>
              </button>

              {showDeepPrompt && (
                <div className="card border border-violet-100 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fill in and send:</p>
                  <pre className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed font-sans">
                    {DEEP_CONSULT_TEMPLATE}
                  </pre>
                  <button
                    onClick={() => {
                      setInput(DEEP_CONSULT_TEMPLATE);
                      setShowDeepPrompt(false);
                      setTimeout(() => textareaRef.current?.focus(), 50);
                    }}
                    className="w-full text-center text-xs text-violet-600 font-semibold py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 transition"
                  >
                    Load template into chat →
                  </button>
                </div>
              )}

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">Or try a quick question…</p>
              <div className="grid grid-cols-1 gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="text-left px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:border-violet-300 hover:bg-violet-50 transition">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[92%] px-4 py-3 rounded-2xl leading-relaxed ${
                msg.role === "user"
                  ? "bg-violet-500 text-white rounded-br-sm text-sm whitespace-pre-wrap"
                  : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm"
              }`}>
                {msg.role === "assistant" ? (
                  <>
                    <span className="text-base mr-1">🤖</span>
                    <MarkdownMessage content={msg.content} />
                  </>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center">
                  <span className="text-base">🤖</span>
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* ── Input bar ── */}
      {tab === "chat" && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-40">
          <div className="max-w-lg mx-auto flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Ask a question or paste your full medical details…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
              }}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none overflow-hidden"
              style={{ minHeight: "42px", maxHeight: "160px" }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40 transition flex-shrink-0"
            >
              Send
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-1">Shift+Enter for new line</p>
        </div>
      )}

      <Navbar />
    </div>
  );
}
