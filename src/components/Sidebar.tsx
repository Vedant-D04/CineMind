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
                    X
                </button>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    <div className="nav-section-title">Analysis Tools</div>
                    {navItems.map((item) => (
                        <button
                            key={item.id}
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
                        className={`nav-item ${activePanel === "settings" ? "active" : ""}`}
                        onClick={() => onPanelChange("settings")}
                    >
                        <span>⚙️</span>
                        <span>Settings</span>
                    </button>
                </div>
            </nav>
        </aside>
    );
}
