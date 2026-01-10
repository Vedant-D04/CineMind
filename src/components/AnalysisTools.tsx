"use client";

import React from "react";

export function ColorPalette({ results }: { results: any }) {
    const metrics = results?.metrics || {};

    return (
        <div id="color-panel" className="content-panel active">
            <div className="analysis-content">
                <div className="color-palette-display">
                    <h4>Current Palette</h4>
                    <div className="color-swatches">
                        {results?.dominant_colors ? (
                            results.dominant_colors.map((color: string, i: number) => (
                                <div key={i} className="color-swatch" style={{ background: color }}></div>
                            ))
                        ) : (
                            <p>Analyzing scene colors...</p>
                        )}
                    </div>
                </div>

                <div className="color-metrics">
                    <div className="metric-item">
                        <label>Average Hue</label>
                        <div className="metric-bar">
                            <div className="metric-fill" style={{ width: '100%', background: 'linear-gradient(90deg, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)' }}></div>
                        </div>
                        <span>{Math.round(metrics.hue || 0)}°</span>
                        <p style={{ fontSize: '0.85rem', marginTop: '4px', opacity: 0.8 }}>
                            {(() => {
                                const hue = metrics.hue || 0;
                                if (hue >= 0 && hue < 30) return "Red tones - Passionate, energetic";
                                if (hue >= 30 && hue < 60) return "Orange/Yellow - Warm, cheerful";
                                if (hue >= 60 && hue < 150) return "Green tones - Natural, calm";
                                if (hue >= 150 && hue < 210) return "Cyan tones - Cool, refreshing";
                                if (hue >= 210 && hue < 270) return "Blue tones - Calm, professional";
                                if (hue >= 270 && hue < 330) return "Purple/Magenta - Creative, mysterious";
                                return "Red tones - Passionate, energetic";
                            })()}
                        </p>
                    </div>
                    <div className="metric-item">
                        <label>Saturation</label>
                        <div className="metric-bar">
                            <div className="metric-fill" style={{ width: `${metrics.saturation || 0}%`, background: 'var(--primary-gradient)' }}></div>
                        </div>
                        <span>{Math.round(metrics.saturation || 0)}%</span>
                        <p style={{ fontSize: '0.85rem', marginTop: '4px', opacity: 0.8 }}>
                            {(() => {
                                const sat = metrics.saturation || 0;
                                if (sat < 20) return "Very desaturated - Muted, subtle";
                                if (sat < 40) return "Low saturation - Calm, understated";
                                if (sat < 60) return "Moderate - Balanced colors";
                                if (sat < 80) return "High saturation - Vibrant, lively";
                                return "Very saturated - Bold, intense";
                            })()}
                        </p>
                    </div>
                    <div className="metric-item">
                        <label>Brightness</label>
                        <div className="metric-bar">
                            <div className="metric-fill" style={{ width: `${metrics.brightness || 0}%`, background: 'white' }}></div>
                        </div>
                        <span>{Math.round(metrics.brightness || 0)}%</span>
                        <p style={{ fontSize: '0.85rem', marginTop: '4px', opacity: 0.8 }}>
                            {(() => {
                                const bright = metrics.brightness || 0;
                                if (bright < 20) return "Very dark - Moody, dramatic";
                                if (bright < 40) return "Dark - Cinematic, serious";
                                if (bright < 60) return "Moderate - Well-balanced";
                                if (bright < 80) return "Bright - Cheerful, open";
                                return "Very bright - High-key, airy";
                            })()}
                        </p>
                    </div>
                </div>

                <div className="suggestions-box">
                    <h4>Mood & Suggestions</h4>
                    <div className="suggestions-list">
                        {(results?.suggestions && results.suggestions.length > 0) ? (
                            results.suggestions.map((s: string, i: number) => (
                                <div key={i} className="suggestion-item">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M10 2L12 8L18 8L13 12L15 18L10 14L5 18L7 12L2 8L8 8L10 2Z" fill="#FFD700" />
                                    </svg>
                                    <span>{s}</span>
                                </div>
                            ))
                        ) : (
                            <div className="suggestion-item">
                                <span>Awaiting color analysis to determine the cinematic mood.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function Framing({ results }: { results: any }) {
    const checks = results?.checks || {};

    return (
        <div id="framing-panel" className="content-panel active">
            <div className="analysis-content">
                <div className="framing-checklist">
                    <h4>Composition Analysis</h4>

                    <div className="checklist-item">
                        <div className="check-icon">{checks.ruleOfThirds ? "✓" : "!"}</div>
                        <div className="check-content">
                            <h5>Rule of Thirds</h5>
                            <p>{checks.ruleOfThirds ? "Subject correctly placed." : "Consider moving subject to a third line."}</p>
                        </div>
                        <div className={`check-status ${checks.ruleOfThirds ? "status-good" : "status-warning"}`}>
                            {checks.ruleOfThirds ? "GOOD" : "ADJUST"}
                        </div>
                    </div>

                    <div className="checklist-item">
                        <div className="check-icon">{checks.headroom ? "✓" : "!"}</div>
                        <div className="check-content">
                            <h5>Headroom</h5>
                            <p>{checks.headroom ? "Optimal space above head." : "Adjust camera tilt/height."}</p>
                        </div>
                        <div className={`check-status ${checks.headroom ? "status-good" : "status-warning"}`}>
                            {checks.headroom ? "GOOD" : "ADJUST"}
                        </div>
                    </div>

                    <div className="checklist-item">
                        <div className="check-icon">{checks.lookingRoom ? "✓" : "!"}</div>
                        <div className="check-content">
                            <h5>Looking Room</h5>
                            <p>{checks.lookingRoom ? "Appropriate space in look direction." : "Subject feels cramped."}</p>
                        </div>
                        <div className={`check-status ${checks.lookingRoom ? "status-good" : "status-warning"}`}>
                            {checks.lookingRoom ? "GOOD" : "ADJUST"}
                        </div>
                    </div>
                </div>

                <div className="suggestions-box">
                    <h4>Framing Suggestions</h4>
                    <div className="suggestions-list">
                        {(results?.suggestions && results.suggestions.length > 0) ? (
                            results.suggestions.map((s: string, i: number) => (
                                <div key={i} className="suggestion-item">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M10 2L12 8L18 8L13 12L15 18L10 14L5 18L7 12L2 8L8 8L10 2Z" fill="#FFD700" />
                                    </svg>
                                    <span>{s}</span>
                                </div>
                            ))
                        ) : (
                            <div className="suggestion-item">
                                <span>Position your subject to begin framing analysis.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
