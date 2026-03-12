"use client";

import React, { useState, useRef, useEffect } from "react";
import { MotionConfig, motion } from "framer-motion";
import { Send, Bot, User } from "lucide-react";

// --- MessageBubble Component ---
// Renders an individual message bubble for the user or the assistant.
function MessageBubble({
    message,
}: {
    message: { id: string; role: "user" | "assistant"; text: string; time: string };
}) {
    const isUser = message.role === "user";

    return (
        <div className={`flex items-start ${isUser ? "justify-end" : "justify-start"}`}>
            {!isUser && (
                <div className="w-10 h-10 rounded-full bg-slate-800/60 flex items-center justify-center mr-3">
                    <Bot size={16} className="text-cyan-300" />
                </div>
            )}

            <div className="max-w-[75%] break-words">
                <div
                    className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isUser
                        ? "bg-gradient-to-r from-slate-700/60 to-slate-800/60 text-slate-100 rounded-br-none"
                        : "bg-gradient-to-r from-[#07142a] to-[#061229] border border-gray-800 text-slate-200 rounded-bl-none"
                        }`}
                >
                    {message.text}
                </div>
                {/* Time stamp moved to align with the text block */}
                <div className={`text-[11px] mt-1 text-slate-500 ${isUser ? "text-right" : "text-left"}`}>
                    {message.time}
                </div>
            </div>

            {isUser && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center ml-3">
                    <User size={14} className="text-white" />
                </div>
            )}
        </div>
    );
}

// --- AIChatBotDark Component ---
// The main component housing the chat interface and logic.
export default function AIChatBotDark() {
    const [messages, setMessages] = useState<
        { id: string; role: "user" | "assistant"; text: string; time: string }[]
    >([
        {
            id: "m1",
            role: "assistant",
            text: "Hey — I'm your AI assistant. Ask me anything or type a prompt to get started!",
            time: new Date().toLocaleTimeString(),
        },
    ]);

    const [value, setValue] = useState("");
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);
    const [isSending, setIsSending] = useState(false);

    // Auto-scroll to the bottom of the chat list when messages change
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    // Send user message and call the backend API
    async function sendMessage(text: string) {
        if (!text.trim()) return;

        // 1. Create and add user message to state
        const userMsg = {
            id: `u-${Date.now()}`,
            role: "user" as const,
            text,
            time: new Date().toLocaleTimeString(),
        };

        setMessages((m) => [...m, userMsg]);
        setValue("");
        setIsSending(true);

        // 2. Call the Synology Docker API
        try {
            // Updated link directly below
            const response = await fetch("http://atgroup.synology.me:5002/api/AI/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userPrompt: text }),
            });

            if (!response.ok) throw new Error("API error");

            const aiText = await response.text();

            // 3. Create and add assistant message to state
            const assistantMsg = {
                id: `a-${Date.now()}`,
                role: "assistant" as const,
                text: aiText,
                time: new Date().toLocaleTimeString(),
            };

            setMessages((m) => [...m, assistantMsg]);
        } catch (err) {
            console.error("AI API Error:", err);

            // 4. Handle API error with a dedicated message
            setMessages((m) => [
                ...m,
                {
                    id: `err-${Date.now()}`,
                    role: "assistant",
                    text: "⚠️ Error contacting AI service. Please try again.",
                    time: new Date().toLocaleTimeString(),
                },
            ]);
        }

        setIsSending(false);
    }
    // Form submission handler
    function onSubmit(e?: React.FormEvent) {
        e?.preventDefault();
        sendMessage(value);
        inputRef.current?.focus();
    }

    // Handler to send message on Enter key press (without Shift)
    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey && !isSending && value.trim()) {
            e.preventDefault();
            onSubmit();
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b1020] via-[#061226] to-[#071323] p-6">
            <div className="w-full max-w-3xl h-[80vh] shadow-2xl rounded-2xl overflow-hidden border border-gray-800 bg-gradient-to-b from-[#091021] to-[#06101b] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-tr from-indigo-600 to-cyan-400 p-2 rounded-full shadow-md">
                            <Bot className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="text-white text-lg font-semibold">TD AI Assistant</h1>
                            <p className="text-sm text-slate-400">Conversational, fast, and private — your AI in dark mode.</p>
                        </div>
                    </div>

                    <button
                        className="text-sm px-3 py-2 rounded-md bg-slate-800/40 text-slate-200 hover:bg-slate-800/60 transition-colors"
                        onClick={() =>
                            setMessages([
                                {
                                    id: "m1",
                                    role: "assistant",
                                    text: "Hey — I'm your AI assistant. Ask me anything or type a prompt to get started!",
                                    time: new Date().toLocaleTimeString(),
                                },
                            ])
                        }
                    >
                        Reset
                    </button>
                </div>

                {/* Chat - Message List Container */}
                <div ref={listRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                    <MotionConfig transition={{ type: "spring", bounce: 0.08 }}>
                        {messages.map((msg) => (
                            <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                                <MessageBubble message={msg} />
                            </motion.div>
                        ))}
                    </MotionConfig>

                    {/* Typing/Sending indicator */}
                    {isSending && (
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center">
                                <Bot size={16} className="text-white animate-pulse" />
                            </div>
                            <div className="bg-slate-800/60 rounded-xl p-3 text-slate-200 w-1/4 max-w-xs animate-pulse">
                                <div className="h-4 bg-slate-700/80 rounded"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Composer (Input Area) */}
                <form onSubmit={onSubmit} className="px-6 py-4 border-t border-gray-800 bg-gradient-to-t from-[#06101b] to-transparent">
                    <div className="flex items-end gap-3">
                        <textarea
                            ref={inputRef}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            placeholder="Write a message..."
                            className="flex-1 resize-none max-h-40 min-h-[44px] bg-slate-800 placeholder:text-slate-500 text-slate-100 px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={isSending || !value.trim()}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-medium shadow-lg hover:shadow-cyan-500/30 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={16} />
                            Send
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}

// Export the MessageBubble for completeness, though typically it would be internal or a separate file.
export { MessageBubble };