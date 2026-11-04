"use client";

import React, { useState, useRef, useEffect } from "react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const suggestions = [
        "A dark, moody detective scene",
        "Wes Anderson style symmetry",
        "Cyberpunk lighting advice",
        "Romantic sunset beach shot"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    if (!isMounted) return null;

    const handleSend = async (text?: string) => {
        const messageText = text || input;
        if (!messageText.trim() || loading) return;

        const userMessage: Message = { role: "user", content: messageText };
        const newMessages = [...messages, userMessage];

        setMessages(newMessages);
        if (!text) setInput("");
        setLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: newMessages.map(m => ({ role: m.role, content: m.content }))
                }),
            });

            const data = await response.json();
            if (data.response) {
                setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
            } else if (data.error) {
                console.error("Backend error:", data.error);
                setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error processing your request." }]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => [...prev, { role: "assistant", content: "Network error. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div id="chat-panel" className="content-panel active">
            <div className="chat-interface">
                <div className="chat-header">
                    <div className="ai-avatar-img-container">
                        <img src="/assets/ray_sketch.png" alt="Ray AI" className="ai-avatar-img" />
                    </div>
                    <div className="ai-info">
                        <h3>Ray AI</h3>
                        <p>Cinematography & Scene Design Assistant</p>
                    </div>
                </div>

                <div className="chat-messages">
                    {messages.length === 0 && (
                        <div className="message assistant-message">
                            <div className="message-content">
                                <p>Hello! I'm Ray, your cinematic assistant. Inspired by the masters, I'm here to help you craft your scene.</p>
                            </div>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div key={i} className={`message ${msg.role === 'assistant' ? 'bot-message' : 'user-message'}`}>
                            <div className="message-content">
                                <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="message bot-message">
                            <div className="message-content">
                                <p><i>Ray is sketching...</i></p>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-suggestions">
                    {suggestions.map((suggestion, i) => (
                        <button
                            key={i}
                            className="suggestion-chip"
                            onClick={() => handleSend(suggestion)}
                        >
                            {suggestion}
                        </button>
                    ))}
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
                        <button id="send-chat-btn" onClick={() => handleSend()} disabled={loading}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 18L18 10L10 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M18 10H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
