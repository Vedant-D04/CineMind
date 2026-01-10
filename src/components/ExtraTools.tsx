"use client";

import React from "react";

export function SceneAnalysis({ results }: { results: any }) {
    const objects = results?.objects || [];
    const isClean = results?.is_clean !== false;

    const getObjectIcon = (name: string) => {
        const icons: any = {
            'person': '👤',
            'chair': '🪑',
            'bottle': '🍾',
            'cup': '☕',
            'phone': '📱',
            'laptop': '💻',
            'book': '📚',
            'bag': '🎒'
        };
        return icons[name.toLowerCase()] || '📦';
    };

    return (
        <div id="scene-panel" className="content-panel active">
            <div className="analysis-content">
                <div className="scene-status">
                    <div className={`status-indicator ${isClean ? "status-clean" : "status-clutter"}`}>
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" />
                            {isClean ? (
                                <path d="M16 24L21 29L32 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            ) : (
                                <path d="M24 14V26M24 32V34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                            )}
                        </svg>
                    </div>
                    <h3>{isClean ? "Scene is Clear" : "Clutter Detected"}</h3>
                    <p>{results?.status || (isClean ? "No unwanted objects detected." : "Adjust your frame to remove clutter.")}</p>
                </div>

                {objects.length > 0 && (
                    <div className="detected-objects">
                        <h4>Detected Items</h4>
                        <div className="objects-grid">
                            {objects.map((obj: any, i: number) => (
                                <div key={i} className="object-tag">
                                    <span className="object-icon">{getObjectIcon(obj.name)}</span>
                                    <span>{obj.name}</span>
                                    <span className="object-confidence">{Math.round(obj.confidence * 100)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
