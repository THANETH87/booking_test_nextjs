"use client";

import { useState, useRef, useEffect, useMemo, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

type ChatMode = "general" | "booking";

const quickQuestions = [
  { label: "📅 ฉันมีนัดวันไหน?", text: "ฉันมีนัดวันไหน?", mode: "booking" as ChatMode },
  { label: "🕐 ร้านเปิดกี่โมง?", text: "ร้านเปิดกี่โมง?", mode: "general" as ChatMode },
  { label: "✂️ มี slot ว่างไหม?", text: "มี slot ว่างในสัปดาห์นี้ไหม?", mode: "booking" as ChatMode },
  { label: "❓ ถามอะไรก็ได้", text: "", mode: "general" as ChatMode },
];

function getMessageText(message: { parts: Array<{ type: string; text?: string }> }): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>("general");
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: user, isLoading: authLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: { mode } }),
    [mode]
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
  });

  const isBusy = status === "submitted" || status === "streaming";

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && user) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, user]);

  const handleModeChange = (newMode: ChatMode) => {
    if (newMode !== mode) {
      setMode(newMode);
      setMessages([]);
    }
  };

  const handleSend = (text: string) => {
    if (!text.trim() || isBusy) return;
    setInput("");
    sendMessage({ text });
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleQuickQuestion = (q: (typeof quickQuestions)[number]) => {
    if (q.mode !== mode) setMode(q.mode);
    if (q.text) {
      sendMessage({ text: q.text });
    } else {
      inputRef.current?.focus();
    }
  };

  const isAuthenticated = !authLoading && !!user;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[45] flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-white shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/40 active:scale-95"
        aria-label="เปิดแชทกับ AI"
      >
        {isOpen ? (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed z-[45] animate-slide-up md:bottom-24 md:right-6 md:w-96 md:h-[32rem] bottom-20 left-4 right-4 h-[70vh] flex flex-col rounded-2xl border border-border bg-surface shadow-xl overflow-hidden"
          role="dialog"
          aria-label="แชทกับผู้ช่วย AI"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 gradient-primary text-white">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <span className="font-semibold text-sm">AI Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              aria-label="ปิดหน้าต่างแชท"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Auth Guard */}
          {!isAuthenticated ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <span className="text-3xl">🔒</span>
              </div>
              <p className="text-foreground font-medium">กรุณาเข้าสู่ระบบก่อน</p>
              <p className="text-sm text-muted">เข้าสู่ระบบเพื่อใช้งาน AI Assistant</p>
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="rounded-xl gradient-primary px-6 py-2 text-sm font-medium text-white shadow-sm shadow-primary/25 transition-all hover:shadow-md"
              >
                เข้าสู่ระบบ
              </Link>
            </div>
          ) : (
            <>
              {/* Mode Tabs */}
              <div className="flex border-b border-border bg-surface-secondary/50">
                <button
                  onClick={() => handleModeChange("general")}
                  className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                    mode === "general"
                      ? "text-primary border-b-2 border-primary bg-surface"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  💬 ถามทั่วไป
                </button>
                <button
                  onClick={() => handleModeChange("booking")}
                  className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                    mode === "booking"
                      ? "text-primary border-b-2 border-primary bg-surface"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  📋 เรื่องการจอง
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-center text-sm text-muted mb-2">
                      สวัสดีค่ะ! เลือกคำถามด้านล่าง หรือพิมพ์ถามได้เลย
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickQuestions.map((q) => (
                        <button
                          key={q.label}
                          onClick={() => handleQuickQuestion(q)}
                          className="rounded-xl border border-border bg-surface-secondary/50 px-3 py-2.5 text-xs text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 text-left"
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          m.role === "user"
                            ? "bg-primary text-white rounded-br-md"
                            : "bg-surface-secondary text-foreground rounded-bl-md"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {getMessageText(m)}
                        </p>
                      </div>
                    </div>
                  ))
                )}

                {/* Typing indicator */}
                {status === "submitted" && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-md bg-surface-secondary px-4 py-3">
                      <div className="flex gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-muted animate-bounce [animation-delay:0ms]" />
                        <span className="h-2 w-2 rounded-full bg-muted animate-bounce [animation-delay:150ms]" />
                        <span className="h-2 w-2 rounded-full bg-muted animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-border p-3">
                <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="พิมพ์ข้อความ..."
                    className="flex-1 rounded-xl border border-border bg-surface-secondary/50 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                    aria-label="พิมพ์ข้อความ"
                    disabled={isBusy}
                  />
                  <button
                    type="submit"
                    disabled={isBusy || !input.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary text-white shadow-sm shadow-primary/25 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="ส่งข้อความ"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>

                {/* Clear button */}
                {messages.length > 0 && (
                  <button
                    onClick={() => setMessages([])}
                    className="mt-2 w-full text-xs text-muted hover:text-foreground transition-colors"
                  >
                    🗑️ ล้างการสนทนา
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
