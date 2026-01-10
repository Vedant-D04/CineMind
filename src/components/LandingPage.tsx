"use client";

import React from "react";

interface LandingPageProps {
    onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
    const scrollToFeatures = () => {
        document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div id="landing-page" className="page active">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-background">
                    <div className="gradient-orb orb-1"></div>
                    <div className="gradient-orb orb-2"></div>
                    <div className="gradient-orb orb-3"></div>
                </div>

                <nav className="navbar">
                    <div className="nav-content">
                        <div className="logo">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
                                <path d="M16 8L20 12L16 16L12 12L16 8Z" fill="white" opacity={0.9} />
                                <path d="M16 16L20 20L16 24L12 20L16 16Z" fill="white" opacity={0.6} />
                                <defs>
                                    <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
                                        <stop offset="0%" stopColor="#667eea" />
                                        <stop offset="100%" stopColor="#764ba2" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <span>CineMind</span>
                        </div>
                        <div className="nav-links">
                            <a href="#features" className="nav-link">Features</a>
                            <a href="#how-it-works" className="nav-link">How It Works</a>
                            <a href="#technology" className="nav-link">Technology</a>
                        </div>
                    </div>
                </nav>

                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="badge-dot"></span>
                        AI-Powered Film Assistant
                    </div>
                    <h1 className="hero-title">
                        Elevate Your <span className="gradient-text">Cinematography</span> with AI
                    </h1>
                    <div style={{ maxWidth: "800px" }}>
                        <p className="hero-description"
                            style={{ fontSize: "1rem", lineHeight: "1.6", textAlign: "justify", marginBottom: "1rem" }}>
                            This system is useful for film students, beginner cinematographers, independent filmmakers, and
                            content creators who need real-time guidance during shooting without access to professional
                            crews.
                            Framing, lighting, and color palette analysis help users understand and apply core
                            cinematography
                            principles such as composition, illumination, and mood, while scene analysis provides contextual
                            awareness to ensure visually appropriate decisions.
                        </p>

                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                            <button onClick={onStart} className="btn btn-primary btn-small">
                                <span>Launch App</span>
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2"
                                        strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <button onClick={scrollToFeatures} className="btn btn-secondary btn-small">
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                                    <path d="M8 5L14 10L8 15V5Z" fill="currentColor" />
                                </svg>
                                <span className="btn-text">Watch Demo</span>
                            </button>
                        </div>
                    </div>

                    <div className="cinematic-icons">
                        <span className="cine-icon" title="Camera">🎥</span>
                        <span className="cine-icon" title="Lighting">💡</span>
                        <span className="cine-icon" title="Film Roll">🎞️</span>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="camera-frame">
                        <div className="frame-corner tl"></div>
                        <div className="frame-corner tr"></div>
                        <div className="frame-corner bl"></div>
                        <div className="frame-corner br"></div>
                        <div className="scan-line"></div>
                        <div className="analysis-overlay">
                            <div className="analysis-item" style={{ "--delay": "0s" } as any}>
                                <div className="analysis-icon">😊</div>
                                <span>Emotion: Happy</span>
                            </div>
                            <div className="analysis-item" style={{ "--delay": "0.2s" } as any}>
                                <div className="analysis-icon">🎨</div>
                                <span>Warm Palette</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features">
                <div className="section-header">
                    <h2 className="section-title">Powerful Features</h2>
                </div>
                <div className="features-grid">
                    {/* Ported from original HTML */}
                    <div className="feature-card">
                        <h3>Real-time Analysis</h3>
                        <p>Instant feedback as you shoot, helping you capture the perfect frame.</p>
                    </div>
                    <div className="feature-card">
                        <h3>Ray AI</h3>
                        <p>Your cinematic assistant inspired by the masters.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
