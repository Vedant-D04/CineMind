"use client";

import React from "react";

interface LandingPageProps {
    onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
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
                            <button onClick={() => scrollToSection("features")} className="nav-link">Features</button>
                            <button onClick={() => scrollToSection("how-it-works")} className="nav-link">How It Works</button>
                            <button onClick={() => scrollToSection("technology")} className="nav-link">Technology</button>
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
                            awareness to ensure visually appropriate decisions. The director chatbot further enhances
                            usability
                            by converting technical insights into clear, creative guidance inspired by professional
                            directing
                            practices. Together, these functions help users improve shot quality, emotional impact, and
                            storytelling efficiency directly on set, making high-quality filmmaking more accessible and
                            practical.
                        </p>

                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                            <button onClick={onStart} className="btn btn-primary btn-small">
                                <span>Get Started</span>
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2"
                                        strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <button onClick={() => scrollToSection("features")} className="btn btn-secondary btn-small">
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

                    <div className="hero-cta">
                        <div className="directors-showcase" style={{ marginTop: "1rem" }}>
                            <h3>Legendary Inspiration</h3>
                            <p className="ray-works"
                                style={{ color: "var(--primary-color)", fontSize: "0.9rem", marginBottom: "0.5rem", fontStyle: "italic" }}>
                                Celebrating the legacy of Satyajit Ray<br />
                                <span style={{ opacity: 0.8, fontSize: "0.8em" }}>(Pather Panchali • Charulata • The Big City)</span>
                            </p>
                            <img src="/assets/directors.png" alt="Famous Directors" className="directors-img" />
                        </div>
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
                            <div className="analysis-item" style={{ "--delay": "0.4s" } as any}>
                                <div className="analysis-icon">📐</div>
                                <span>Rule of Thirds</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features">
                <div className="section-header">
                    <h2 className="section-title">Powerful Features</h2>
                    <p className="section-description">Everything you need to create professional-grade cinematography</p>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <circle cx="16" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
                                <path d="M8 26C8 22 11 19 16 19C21 19 24 22 24 26" stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" />
                            </svg>
                        </div>
                        <h3>Face Detection</h3>
                        <p>Advanced face detection with real-time tracking and bounding box visualization</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="2" />
                                <path d="M11 14C11 14 12 12 14 12C16 12 17 14 17 14" stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" />
                                <path d="M18 14C18 14 19 12 21 12C23 12 24 14 24 14" stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" />
                                <path d="M10 20C10 20 12 23 16 23C20 23 22 20 22 20" stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" />
                            </svg>
                        </div>
                        <h3>Emotion Analysis</h3>
                        <p>AI-powered emotion recognition detecting happiness, sadness, anger, surprise, and more</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <rect x="6" y="6" width="8" height="8" rx="2" fill="currentColor" opacity="0.3" />
                                <rect x="18" y="6" width="8" height="8" rx="2" fill="currentColor" opacity="0.6" />
                                <rect x="6" y="18" width="8" height="8" rx="2" fill="currentColor" opacity="0.8" />
                                <rect x="18" y="18" width="8" height="8" rx="2" fill="currentColor" />
                            </svg>
                        </div>
                        <h3>Color Palette Analysis</h3>
                        <p>Intelligent color analysis with mood-based palette suggestions for perfect atmosphere</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <rect x="4" y="4" width="24" height="24" rx="2" stroke="currentColor" strokeWidth="2" />
                                <line x1="14" y1="4" x2="14" y2="28" stroke="currentColor" strokeWidth="1.5"
                                    strokeDasharray="4 4" />
                                <line x1="18" y1="4" x2="18" y2="28" stroke="currentColor" strokeWidth="1.5"
                                    strokeDasharray="4 4" />
                                <line x1="4" y1="14" x2="28" y2="14" stroke="currentColor" strokeWidth="1.5"
                                    strokeDasharray="4 4" />
                                <line x1="4" y1="18" x2="28" y2="18" stroke="currentColor" strokeWidth="1.5"
                                    strokeDasharray="4 4" />
                            </svg>
                        </div>
                        <h3>Framing Analysis</h3>
                        <p>Rule of thirds, headroom, and looking room analysis for perfect composition</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <path d="M16 4L4 10V16C4 23 16 28 16 28C16 28 28 23 28 16V10L16 4Z" stroke="currentColor"
                                    strokeWidth="2" strokeLinejoin="round" />
                                <path d="M12 16L15 19L21 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                    strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h3>Scene Analysis</h3>
                        <p>Detect unwanted objects and background clutter to maintain clean, professional shots</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2" />
                                <path d="M16 8V16L21 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h3>Real-time Feedback</h3>
                        <p>Instant analysis and suggestions as you shoot, helping you capture the perfect frame</p>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="how-it-works">
                <div className="section-header">
                    <h2 className="section-title">How It Works</h2>
                    <p className="section-description">Simple workflow, powerful results</p>
                </div>

                <div className="workflow-steps">
                    <div className="workflow-step">
                        <div className="step-number">01</div>
                        <div className="step-content">
                            <h3>Connect Camera</h3>
                            <p>Connect your camera or webcam to start capturing footage</p>
                        </div>
                        <div className="step-line"></div>
                    </div>

                    <div className="workflow-step">
                        <div className="step-number">02</div>
                        <div className="step-content">
                            <h3>Real-time Analysis</h3>
                            <p>AI analyzes your footage for faces, emotions, composition, and colors</p>
                        </div>
                        <div className="step-line"></div>
                    </div>

                    <div className="workflow-step">
                        <div className="step-number">03</div>
                        <div className="step-content">
                            <h3>Get Suggestions</h3>
                            <p>Receive instant feedback and suggestions to improve your shot</p>
                        </div>
                        <div className="step-line"></div>
                    </div>

                    <div className="workflow-step">
                        <div className="step-number">04</div>
                        <div className="step-content">
                            <h3>Perfect Your Shot</h3>
                            <p>Adjust your framing and composition based on AI recommendations</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Technology Section */}
            <section id="technology" className="technology">
                <div className="section-header">
                    <h2 className="section-title">Powered by Advanced AI</h2>
                    <p className="section-description">Built with cutting-edge machine learning models</p>
                </div>

                <div className="tech-grid">
                    <div className="tech-card">
                        <div className="tech-badge">Deep Learning</div>
                        <h3>PyTorch</h3>
                        <p>Neural networks for emotion recognition</p>
                    </div>

                    <div className="tech-card">
                        <div className="tech-badge">Object Detection</div>
                        <h3>YOLOv5</h3>
                        <p>Real-time scene and object detection</p>
                    </div>

                    <div className="tech-card">
                        <div className="tech-badge">Computer Vision</div>
                        <h3>OpenCV</h3>
                        <p>Advanced image processing and analysis</p>
                    </div>

                    <div className="tech-card">
                        <div className="tech-badge">Face Recognition</div>
                        <h3>Haar Cascade</h3>
                        <p>Accurate face detection and tracking</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to Transform Your Cinematography?</h2>
                    <p>Start creating professional-grade footage with AI-powered assistance</p>
                    <button onClick={onStart} className="btn btn-primary btn-large">
                        <span>Launch CineMind</span>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="logo">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <rect width="32" height="32" rx="8" fill="url(#logo-gradient-footer)" />
                                <path d="M16 8L20 12L16 16L12 12L16 8Z" fill="white" opacity={0.9} />
                                <path d="M16 16L20 20L16 24L12 20L16 16Z" fill="white" opacity={0.6} />
                                <defs>
                                    <linearGradient id="logo-gradient-footer" x1="0" y1="0" x2="32" y2="32">
                                        <stop offset="0%" stopColor="#667eea" />
                                        <stop offset="100%" stopColor="#764ba2" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <span>CineMind</span>
                        </div>
                        <p>AI-Powered Film Assistant</p>
                    </div>
                    <div className="footer-copyright">
                        <p>&copy; 2026 CineMind. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
