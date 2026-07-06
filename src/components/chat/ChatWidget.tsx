"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  needsConfirmation?: boolean;
  timestamp: string;
}

const QUICK_REPLIES = [
  "Con bị dị ứng...",
  "Tuần này có khách",
  "Muốn giảm cân",
  "Đổi món hôm nay",
  "Ăn chay ngày mai",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastChanges, setLastChanges] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const familyId = localStorage.getItem("family_id");
    if (!familyId) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ family_id: familyId, message: text }),
      });
      const data = await res.json();
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "ai",
        text: res.ok ? data.response : (data.error ?? "Có lỗi xảy ra, thử lại nhé."),
        needsConfirmation: data.needsConfirmation,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      if (data.changes?.status === "applied") setLastChanges(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "ai", text: "Mất kết nối. Thử lại nhé.", timestamp: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUndo() {
    const familyId = localStorage.getItem("family_id");
    if (!familyId) return;
    setUndoing(true);
    try {
      const menuWeekStart = new Date().toISOString().slice(0, 10);
      const res = await fetch("/api/menu/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ family_id: familyId, week_start: menuWeekStart }),
      });
      if (res.ok) {
        setLastChanges(false);
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "ai", text: "✅ Đã hoàn tác thay đổi gần nhất.", timestamp: new Date().toISOString() },
        ]);
      } else {
        const d = await res.json();
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "ai", text: d.error ?? "Không thể hoàn tác.", timestamp: new Date().toISOString() },
        ]);
      }
    } catch {
      // silent
    } finally {
      setUndoing(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-2xl shadow-lg transition-all flex items-center justify-center"
        aria-label="Chat với trợ lý dinh dưỡng"
      >
        {open ? "✕" : "🤖"}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-36 right-4 md:bottom-24 md:right-6 z-50 w-80 md:w-96 flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden max-h-[70vh]">
          {/* Header with undo */}
          <div className="bg-gray-500 text-white px-4 py-3 flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <div className="flex-1">
              <div className="font-semibold text-sm">Trợ lý AI dinh dưỡng</div>
              <div className="text-xs opacity-80">Tính năng đang phát triển</div>
            </div>
            {lastChanges && (
              <button
                onClick={handleUndo}
                disabled={undoing}
                className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                title="Hoàn tác thay đổi AI vừa thực hiện"
              >
                {undoing ? "..." : "↩ Hoàn tác"}
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
            <div className="text-center text-sm text-gray-400 py-6 px-3">
              <div className="text-4xl mb-3">🚧</div>
              <p className="font-medium text-gray-600 dark:text-gray-300 mb-1">Tính năng đang phát triển</p>
              <p className="text-xs leading-relaxed">
                Trợ lý AI dinh dưỡng sẽ giúp điều chỉnh thực đơn theo nhu cầu phát sinh. Cần cấu hình API key để kích hoạt.
              </p>
            </div>
            {messages.length === 0 && false && ( // placeholder, AI disabled
              <div className="text-center text-sm text-gray-400 py-4">
                <div className="text-3xl mb-2">👋</div>
                Xin chào! Mình có thể giúp điều chỉnh thực đơn, tính dinh dưỡng, gợi ý món ăn phù hợp.
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                    msg.role === "user"
                      ? "bg-brand-500 text-white rounded-br-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm"
                  )}
                >
                  {msg.text}
                  {msg.needsConfirmation && (
                    <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 border-t border-yellow-200 pt-2">
                      ⚠️ Cần xác nhận trước khi áp dụng
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-gray-500">
                  <span className="animate-pulse">Đang xử lý...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {messages.length === 0 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs bg-brand-50 dark:bg-gray-800 text-brand-700 dark:text-brand-300 rounded-full px-2 py-1 hover:bg-brand-100 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-100 dark:border-gray-800 p-3 flex gap-2">
            <input
              className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="Nhắn tin..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
              disabled={loading}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="btn-primary px-3 py-2 text-sm disabled:opacity-50"
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
