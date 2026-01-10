"use client";

import React from "react";

export function SceneAnalysis() {
    return (
        <div id="scene-panel" className="content-panel active">
            <div className="analysis-content">
                <div className="scene-status">
                    <h3>Scene is Clear</h3>
                    <p>No unwanted objects detected in background.</p>
                </div>
            </div>
        </div>
    );
}

export function Settings() {
    return (
        <div id="settings-panel" className="content-panel active">
            <div className="settings-content">
                <div className="settings-section">
                    <h4>Camera Source</h4>
                    <select className="setting-select">
                        <option>Default Camera</option>
                    </select>
                </div>
                <div className="settings-section">
                    <h4>Analysis Engine</h4>
                    <p>Running on Vercel Edge (Lightweight Mode)</p>
                </div>
            </div>
        </div>
    );
}
