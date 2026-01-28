import { useState, useRef, useEffect } from "react";
import { Headset, X, Send, Sparkles, User, AlertCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
    sendChatMessage,
    RateLimitError,
    SpamBlockError,
    formatBlockedTime
} from "@/services/chatApi";

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
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockedUntil, setBlockedUntil] = useState<string | null>(null);
    const [rateLimited, setRateLimited] = useState(false);
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

    // Sprawdź czy blokada już minęła
    useEffect(() => {
        if (blockedUntil) {
            const checkInterval = setInterval(() => {
                const now = new Date();
                const until = new Date(blockedUntil);

                if (now >= until) {
                    setIsBlocked(false);
                    setBlockedUntil(null);
                    setError(null);
                    clearInterval(checkInterval);
                }
            }, 1000);

            return () => clearInterval(checkInterval);
        }
    }, [blockedUntil]);

    const handleSend = async () => {
        if (!inputValue.trim() || isTyping || isBlocked) return;

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
        setRateLimited(false);

        try {
            // Przygotuj historię konwersacji
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

            // Obsługa różnych typów błędów
            if (error instanceof SpamBlockError) {
                // Trwała blokada
                setIsBlocked(true);
                setBlockedUntil(error.blockedUntil || null);
                setError(error.message);

                const blockMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    content: `⚠️ ${error.message}\n\n${error.blockedUntil ? formatBlockedTime(error.blockedUntil) : ''}`,
                    role: "assistant",
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, blockMessage]);
            } else if (error instanceof RateLimitError) {
                // Rate limit
                setRateLimited(true);
                setError(error.message);

                const rateLimitMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    content: `⏱️ ${error.message}\n\nBitte warten Sie einen Moment, bevor Sie die nächste Nachricht senden.`,
                    role: "assistant",
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, rateLimitMessage]);

                // Auto-reset rate limit po 2 sekundach
                setTimeout(() => {
                    setRateLimited(false);
                    setError(null);
                }, 2000);
            } else {
                // Inny błąd
                setError(error.message);

                const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    content: "Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Nachricht. Bitte versuchen Sie es erneut.",
                    role: "assistant",
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, errorMessage]);
            }
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
                    isOpen && "rotate-90",
                    isBlocked && "opacity-50"
                )}
                aria-label={isOpen ? "Chat schließen" : "Chat öffnen"}
                disabled={isBlocked}
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : isBlocked ? (
                    <ShieldAlert className="w-6 h-6" />
                ) : (
                    <Headset className="w-6 h-6" />
                )}
            </button>

            {/* Pulse indicator when closed */}
            {!isOpen && !isBlocked && (
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
                <div className={cn(
                    "bg-gradient-to-r p-4 text-primary-foreground",
                    isBlocked ? "from-red-600 to-red-700" : "from-primary to-accent"
                )}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                            {isBlocked ? (
                                <ShieldAlert className="w-5 h-5" />
                            ) : (
                                <Sparkles className="w-5 h-5" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-display font-semibold text-lg">
                                {isBlocked ? "Chat Gesperrt" : "STAPLERO Assistent"}
                            </h3>
                            <p className="text-xs text-primary-foreground/80">
                                {isBlocked
                                    ? blockedUntil ? formatBlockedTime(blockedUntil) : "Vorübergehend gesperrt"
                                    : isTyping
                                        ? "Schreibt..."
                                        : "Immer für Sie da"
                                }
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className={cn(
                                "w-2 h-2 rounded-full",
                                isBlocked ? "bg-red-400" :
                                    error ? "bg-yellow-400" :
                                        "bg-green-400 animate-pulse"
                            )} />
                            <span className="text-xs">
                                {isBlocked ? "Gesperrt" : error ? "Warnung" : "Online"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Error/Warning Banner */}
                {(error || rateLimited) && !isBlocked && (
                    <div className={cn(
                        "border-b p-3 flex items-start gap-2",
                        rateLimited ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"
                    )}>
                        <AlertCircle className={cn(
                            "w-4 h-4 flex-shrink-0 mt-0.5",
                            rateLimited ? "text-yellow-600" : "text-red-600"
                        )} />
                        <p className={cn(
                            "text-xs",
                            rateLimited ? "text-yellow-800" : "text-red-800"
                        )}>
                            {error}
                        </p>
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
                                        "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line",
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
                    {isBlocked ? (
                        <div className="text-center py-2">
                            <ShieldAlert className="w-8 h-8 mx-auto text-red-500 mb-2" />
                            <p className="text-sm text-red-600 font-medium">
                                Chat vorübergehend gesperrt
                            </p>
                            {blockedUntil && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatBlockedTime(blockedUntil)}
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="flex gap-2">
                                <Input
                                    ref={inputRef}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Schreiben Sie eine Nachricht..."
                                    className="flex-1 rounded-full bg-muted border-0 focus-visible:ring-primary"
                                    disabled={isTyping || rateLimited}
                                    maxLength={500}
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() || isTyping || rateLimited}
                                    size="icon"
                                    className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground w-10 h-10 flex-shrink-0"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground text-center mt-2">
                                Powered by STAPLERO AI • {inputValue.length}/500
                            </p>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default ChatWidget;
