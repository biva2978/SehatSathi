"use client";
import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What foods are good for PCOS?",
  "Side effects of Metformin?",
  "How to lower blood pressure naturally?",
  "What is a good diet for diabetes?",
  "How much water should I drink daily?",
  "Best high-protein foods in Bangladesh?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = localStorage.getItem("sehatsathi_profile");
    if (p) setProfile(JSON.parse(p));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, profile }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages([...updated, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
      } else {
        setMessages([...updated, { role: "assistant", content: data.content }]);
      }
    } catch {
      setMessages([...updated, { role: "assistant", content: "Network error. Please check your connection." }]);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen pb-28 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-500 to-purple-500 px-5 pt-12 pb-8 text-white">
        <h1 className="text-2xl font-bold">AI Health Assistant 🤖</h1>
        <p className="text-violet-100 text-sm mt-1">
          Ask anything about health, medicines &amp; diet
        </p>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 mt-4 flex flex-col gap-3">

        {/* Empty state with suggestions */}
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="card bg-violet-50 border border-violet-100 flex gap-3 items-start">
              <span className="text-2xl">🤖</span>
              <div>
                <p className="font-semibold text-violet-800 text-sm">Hi! I&apos;m your SehatSathi AI</p>
                <p className="text-xs text-violet-600 mt-0.5">
                  Ask me about medicines, diet, symptoms, or anything health-related. I know your profile and will personalise my answers.
                </p>
              </div>
            </div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
              Try asking…
            </p>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:border-violet-300 hover:bg-violet-50 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-violet-500 text-white rounded-br-sm"
                  : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm"
              }`}
            >
              {msg.role === "assistant" && (
                <span className="text-base mr-1">🤖</span>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="text-base">🤖</span>
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar — above navbar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-40">
        <div className="max-w-lg mx-auto flex gap-2">
          <input
            type="text"
            placeholder="Ask about health, medicines, diet…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40 transition"
          >
            Send
          </button>
        </div>
      </div>

      <Navbar />
    </div>
  );
}
