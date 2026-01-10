"use client";

import React, { useState, useRef, useEffect } from "react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hello! I'm Ray, your cinematic assistant. Inspired by the masters, I'm here to help you craft your scene." }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [...messages, userMessage] }),
            });

            const data = await response.json();
            if (data.response) {
                setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
            }
        } catch (error) {
            console.error("Chat error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div id="chat-panel" className="content-panel active">
            <div className="chat-interface">
                <div className="chat-header">
                    <div className="ai-info">
                        <h3>Ray AI</h3>
                        <p>Cinematography & Scene Design Assistant</p>
                    </div>
                </div>

                <div className="chat-messages">
                    {messages.map((msg, i) => (
                        <div key={i} className={`message ${msg.role}-message`}>
                            <div className="message-content">
                                <p>{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {loading && <div className="message bot-message"><div className="message-content">Ray is thinking...</div></div>}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-area">
                    <div className="input-wrapper">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Describe your scene or ask for advice..."
                        />
                        <button onClick={handleSend} disabled={loading}>
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
