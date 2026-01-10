"use client";

import React from "react";

export function ColorPalette() {
    return (
        <div id="color-panel" className="content-panel active">
            <div className="analysis-content">
                <div className="color-palette-display">
                    <h4>Current Palette (Mock)</h4>
                    <div className="color-swatches">
                        <div className="color-swatch" style={{ background: "#FF6B6B" }}></div>
                        <div className="color-swatch" style={{ background: "#4ECDC4" }}></div>
                        <div className="color-swatch" style={{ background: "#45B7D1" }}></div>
                        <div className="color-swatch" style={{ background: "#FFA07A" }}></div>
                    </div>
                </div>
                <div className="suggestions-box">
                    <h4>Suggestions</h4>
                    <div className="suggestion-item">
                        <span>The warm tones reflect a cozy, intimate scene.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function Framing() {
    return (
        <div id="framing-panel" className="content-panel active">
            <div className="analysis-content">
                <div className="framing-checklist">
                    <h4>Composition Checklist</h4>
                    <div className="checklist-item">
                        <h5>Rule of Thirds</h5>
                        <p>Good</p>
                    </div>
                </div>
                <div className="suggestions-box">
                    <h4>Framing Suggestions</h4>
                    <div className="suggestion-item">
                        <span>Centered subject creates a formal, structured feel.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
