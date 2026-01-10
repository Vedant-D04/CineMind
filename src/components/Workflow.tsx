"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import CameraFeed from "./CameraFeed";
import Chat from "./Chat";
import { ColorPalette, Framing } from "./AnalysisTools";
import { SceneAnalysis, Settings } from "./ExtraTools";

interface WorkflowProps {
    onBack: () => void;
}

export type PanelType = "camera" | "chat" | "color" | "framing" | "scene" | "settings";

export default function Workflow({ onBack }: WorkflowProps) {
    const [activePanel, setActivePanel] = useState<PanelType>("camera");

    const renderPanel = () => {
        switch (activePanel) {
            case "camera": return <CameraFeed />;
            case "chat": return <Chat />;
            case "color": return <ColorPalette />;
            case "framing": return <Framing />;
            case "scene": return <SceneAnalysis />;
            case "settings": return <Settings />;
            default: return <CameraFeed />;
        }
    };

    return (
        <div id="workflow-page" className="page active">
            <div className="workflow-container">
                <Sidebar
                    activePanel={activePanel}
                    onPanelChange={setActivePanel}
                    onBack={onBack}
                />

                <main className="main-content">
                    {/* Shared workspace (Camera & Stats) is hidden for Chat and Settings in original JS */}
                    {activePanel !== "chat" && activePanel !== "settings" && (
                        <div className="shared-workspace">
                            <CameraFeed />
                        </div>
                    )}

                    <div className="tool-panels">
                        {activePanel === "chat" && <Chat />}
                        {activePanel === "settings" && <Settings />}
                        {activePanel === "color" && <ColorPalette />}
                        {activePanel === "framing" && <Framing />}
                        {activePanel === "scene" && <SceneAnalysis />}
                        {activePanel === "camera" && (
                            <div className="content-panel active">
                                <div className="overview-box">
                                    <h3>Welcome to CineMind Analysis</h3>
                                    <p>Select a tool from the sidebar to see detailed real-time analysis here.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
