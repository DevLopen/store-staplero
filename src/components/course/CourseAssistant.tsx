import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface CourseAssistantProps {
  courseTitle: string;
  chapterTitle: string;
  topicTitle?: string;
  topicContent?: string;
  chapterId: string; // used to reset when chapter changes
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function CourseAssistant({
                                          courseTitle,
                                          chapterTitle,
                                          topicTitle,
                                          topicContent,
                                          chapterId,
                                        }: CourseAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [prevChapterId, setPrevChapterId] = useState(chapterId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Reset conversation when chapter changes
  useEffect(() => {
    if (chapterId !== prevChapterId) {
      setMessages([]);
      setPrevChapterId(chapterId);
    }
  }, [chapterId, prevChapterId]);

  // Scroll to bottom
  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMessage: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/chat/course-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
          context: {
            courseTitle,
            chapterTitle,
            topicTitle,
            topicContent: topicContent?.replace(/<[^>]+>/g, " ").slice(0, 2000), // strip HTML, limit length
          },
        }),
      });

      if (!res.ok) throw new Error("Błąd serwera");
      const data = await res.json();

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.response, timestamp: new Date() },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Przepraszam, wystąpił błąd. Spróbuj ponownie.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    "Wyjaśnij kluczowe pojęcia z tego rozdziału",
    "Jakie są najważniejsze zasady BHP?",
    "Podaj przykład z praktyki",
    "Co powinienem zapamiętać?",
  ];

  return (
      <>
        {/* Floating button */}
        {!open && (
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-2xl shadow-lg shadow-amber-500/30 transition-all hover:scale-105 hover:shadow-amber-500/50"
            >
              <Bot className="h-5 w-5" />
              <span className="text-sm">Asystent kursu</span>
            </button>
        )}

        {/* Chat panel */}
        {open && (
            <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-24px)] h-[500px] max-h-[calc(100vh-100px)] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-b border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-slate-950" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">Asystent kursu</p>
                    <p className="text-amber-400/80 text-xs truncate max-w-[220px]">{chapterTitle}</p>
                  </div>
                </div>
                <button
                    onClick={() => setOpen(false)}
                    className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
                {messages.length === 0 && (
                    <div className="space-y-4">
                      <div className="flex gap-2.5">
                        <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot className="h-3.5 w-3.5 text-slate-950" />
                        </div>
                        <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                          <p className="text-slate-200 text-sm">
                            Cześć! Jestem Twoim asystentem dla rozdziału <strong className="text-amber-400">„{chapterTitle}"</strong>.
                            Mogę pomóc Ci zrozumieć materiał z tego rozdziału. W czym mogę pomóc?
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-slate-500 text-xs px-1">Sugerowane pytania:</p>
                        {suggestedQuestions.map(q => (
                            <button
                                key={q}
                                onClick={() => { setInput(q); inputRef.current?.focus(); }}
                                className="w-full text-left text-xs text-slate-400 hover:text-amber-400 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 rounded-xl px-3 py-2 transition-all"
                            >
                              {q}
                            </button>
                        ))}
                      </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          msg.role === "user" ? "bg-slate-700" : "bg-amber-500"
                      }`}>
                        {msg.role === "user"
                            ? <User className="h-3.5 w-3.5 text-slate-300" />
                            : <Bot className="h-3.5 w-3.5 text-slate-950" />
                        }
                      </div>
                      <div className={`rounded-2xl px-4 py-3 max-w-[85%] ${
                          msg.role === "user"
                              ? "bg-amber-500 text-slate-950 rounded-tr-sm"
                              : "bg-slate-800 text-slate-200 rounded-tl-sm"
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                ))}

                {sending && (
                    <div className="flex gap-2.5">
                      <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="h-3.5 w-3.5 text-slate-950" />
                      </div>
                      <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-slate-700/60">
                {messages.length > 0 && (
                    <button
                        onClick={() => setMessages([])}
                        className="text-xs text-slate-600 hover:text-slate-400 mb-2 block transition-colors"
                    >
                      Wyczyść rozmowę (przejście do nowego rozdziału czyści automatycznie)
                    </button>
                )}
                <div className="flex gap-2 items-end">
              <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Zadaj pytanie o ten rozdział..."
                  className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-amber-500/60 transition-colors min-h-[40px] max-h-[120px]"
                  rows={1}
                  style={{ height: 'auto' }}
                  onInput={e => {
                    const t = e.target as HTMLTextAreaElement;
                    t.style.height = 'auto';
                    t.style.height = Math.min(t.scrollHeight, 120) + 'px';
                  }}
              />
                  <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || sending}
                      size="icon"
                      className="h-10 w-10 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl flex-shrink-0 disabled:opacity-40"
                  >
                    {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
        )}
      </>
  );
}