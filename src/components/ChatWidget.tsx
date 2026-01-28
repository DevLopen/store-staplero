// src/components/ChatWidget.tsx
import { useState, useRef, useEffect } from "react";
import { Headset, X, Send, Sparkles, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { sendChatMessage } from "@/services/chatApi";

interface Message {
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: Date;
}

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            content: "Hallo! Ich bin Ihr STAPLERO Assistent. Wie kann ich Ihnen heute helfen?",
            role: "assistant",
            timestamp: new Date(),
        },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!inputValue.trim() || isTyping) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            content: inputValue,
            role: "user",
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
        setIsTyping(true);
        setError(null);

        try {
            // Przygotuj historię konwersacji (ostatnie 10 wiadomości bez welcome message)
            const conversationHistory = messages
                .filter(msg => msg.id !== "welcome")
                .slice(-10)
                .map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));

            // Wywołaj AI API
            const aiResponse = await sendChatMessage(inputValue, conversationHistory);

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: aiResponse,
                role: "assistant",
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error: any) {
            console.error("Chat error:", error);
            setError(error.message);

            // Dodaj wiadomość o błędzie
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: "Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Nachricht. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt.",
                role: "assistant",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Chat Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center",
                    "bg-gradient-to-r from-primary to-accent text-primary-foreground",
                    "hover:scale-110 hover:shadow-xl",
                    isOpen && "rotate-90"
                )}
                aria-label={isOpen ? "Chat schließen" : "Chat öffnen"}
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <Headset className="w-6 h-6" />
                )}
            </button>

            {/* Pulse indicator when closed */}
            {!isOpen && (
                <div className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary/30 animate-ping pointer-events-none" />
            )}

            {/* Chat Window */}
            <div
                className={cn(
                    "fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] rounded-2xl shadow-2xl transition-all duration-300 origin-bottom-right",
                    "bg-card border border-border overflow-hidden",
                    isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
                )}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-accent p-4 text-primary-foreground">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-display font-semibold text-lg">STAPLERO Assistent</h3>
                            <p className="text-xs text-primary-foreground/80">
                                {isTyping ? "Schreibt..." : "Immer für Sie da"}
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className={cn(
                                "w-2 h-2 rounded-full",
                                error ? "bg-red-400" : "bg-green-400 animate-pulse"
                            )} />
                            <span className="text-xs">{error ? "Fehler" : "Online"}</span>
                        </div>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 border-b border-red-200 p-3 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-800">{error}</p>
                    </div>
                )}

                {/* Messages Area */}
                <ScrollArea className="h-[350px] p-4" ref={scrollRef}>
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex gap-2 animate-fade-in",
                                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                        message.role === "user"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {message.role === "user" ? (
                                        <User className="w-4 h-4" />
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )}
                                </div>
                                <div
                                    className={cn(
                                        "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                                        message.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-br-md"
                                            : "bg-muted text-foreground rounded-bl-md"
                                    )}
                                >
                                    {message.content}
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {isTyping && (
                            <div className="flex gap-2 animate-fade-in">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t border-border bg-card">
                    <div className="flex gap-2">
                        <Input
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Schreiben Sie eine Nachricht..."
                            className="flex-1 rounded-full bg-muted border-0 focus-visible:ring-primary"
                            disabled={isTyping}
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || isTyping}
                            size="icon"
                            className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground w-10 h-10 flex-shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                        Powered by STAPLERO AI
                    </p>
                </div>
            </div>
        </>
    );
};

export default ChatWidget;