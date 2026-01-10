"use client";

import React from "react";
import { PanelType } from "./Workflow";

interface SidebarProps {
    activePanel: PanelType;
    onPanelChange: (panel: PanelType) => void;
    onBack: () => void;
}

export default function Sidebar({ activePanel, onPanelChange, onBack }: SidebarProps) {
    const navItems = [
        { id: "camera", label: "Camera Feed", icon: "🎥" },
        { id: "chat", label: "Ray AI", icon: "🤖" },
        { id: "color", label: "Color Palette", icon: "🎨" },
        { id: "framing", label: "Framing", icon: "📐" },
        { id: "scene", label: "Scene Analysis", icon: "🎬" },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo" onClick={onBack} style={{ cursor: "pointer" }}>
                    <span>CineMind</span>
                </div>
                <button onClick={onBack} className="icon-btn" title="Back to Home">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M15 10H5M5 10L9 6M5 10L9 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    <div className="nav-section-title">Analysis Tools</div>
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            id={`nav-${item.id}`}
                            data-panel={item.id}
                            className={`nav-item ${activePanel === item.id ? "active" : ""}`}
                            onClick={() => onPanelChange(item.id as PanelType)}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>

                <div className="nav-section">
                    <div className="nav-section-title">Settings</div>
                    <button
                        id="nav-settings"
                        data-panel="settings"
                        className={`nav-item ${activePanel === "settings" ? "active" : ""}`}
                        onClick={() => onPanelChange("settings")}
                    >
                        <span>⚙️</span>
                        <span>Settings</span>
                    </button>
                </div>
            </nav>

            <div className="sidebar-footer">
                <button id="tutorial-btn" className="btn btn-secondary btn-small" onClick={() => (window as any).startTutorial?.()}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M8 6V8M8 10H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span>Tutorial</span>
                </button>
            </div>
        </aside>
    );
}
