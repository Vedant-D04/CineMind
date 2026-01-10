"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import CameraFeed from "./CameraFeed";
import Chat from "./Chat";
import { ColorPalette, Framing } from "./AnalysisTools";
import { SceneAnalysis, Settings } from "./ExtraTools";
import Tutorial from "./Tutorial";

interface WorkflowProps {
    onBack: () => void;
}

export type PanelType = "camera" | "chat" | "color" | "framing" | "scene" | "settings";

export default function Workflow({ onBack }: WorkflowProps) {
    const [activePanel, setActivePanel] = useState<PanelType>("camera");
    const [analysisResults, setAnalysisResults] = useState<any>(null);
    const [showTutorial, setShowTutorial] = useState(false);

    useEffect(() => {
        // Register global trigger for sidebar button
        (window as any).startTutorial = () => setShowTutorial(true);

        // Auto-show tutorial for first-time users
        const hasSeenTutorial = localStorage.getItem('cinemind-tutorial-seen');
        if (!hasSeenTutorial) {
            setTimeout(() => setShowTutorial(true), 1000);
        }

        return () => { delete (window as any).startTutorial; };
    }, []);


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
                            <CameraFeed onResults={setAnalysisResults} results={analysisResults} />
                        </div>
                    )}

                    <div className="tool-panels">
                        {activePanel === "chat" && <Chat />}
                        {activePanel === "settings" && <Settings />}
                        {activePanel === "color" && <ColorPalette results={analysisResults?.color_analysis} />}
                        {activePanel === "framing" && <Framing results={analysisResults?.framing} />}
                        {activePanel === "scene" && <SceneAnalysis results={analysisResults?.scene} />}
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
            {showTutorial && <Tutorial onFinish={() => setShowTutorial(false)} />}
        </div>
    );
}
