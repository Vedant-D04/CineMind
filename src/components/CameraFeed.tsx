"use client";

import React, { useRef, useState, useEffect } from "react";

interface CameraFeedProps {
    onResults: (results: any) => void;
    results: any;
}

import { loadModels, analyzeColor, analyzeFraming, analyzeScene } from "../utils/clientAnalysis";

export default function CameraFeed({ onResults, results }: CameraFeedProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [fps, setFps] = useState(0);

    // Load models on mount
    useEffect(() => {
        loadModels();
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsStreaming(true);
            }
        } catch (err) {
            console.error("Camera error:", err);
        }
    };

    const stopCamera = () => {
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
        setIsStreaming(false);
        onResults(null);
    };

    useEffect(() => {
        let animationId: number;
        let frameCount = 0;
        let lastTime = Date.now();
        let lastAnalysisTime = 0;
        const ANALYSIS_INTERVAL = 500; // Analyze every 500ms for responsiveness

        const loop = async () => {
            if (isStreaming && videoRef.current && canvasRef.current) {
                frameCount++;
                const now = Date.now();

                // FPS Calc
                if (now - lastTime >= 1000) {
                    setFps(frameCount);
                    frameCount = 0;
                    lastTime = now;
                }

                const ctx = canvasRef.current.getContext("2d");
                if (ctx) {
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                    // Draw Faces from previous results
                    if (results?.faces) {
                        results.faces.forEach((face: any) => {
                            // BlazeFace returns [x, y] for topLeft and bottomRight
                            // Or passing raw predictions, need to handle format from analyzeFraming
                            // Assuming clientAnalysis normalized it or we handle it here.
                            // Let's assume analyzeFraming passes raw predictions, usually objects.

                            // Check format: TensorFlow.js BlazeFace returns objects with topLeft, bottomRight
                            const start = face.topLeft as [number, number];
                            const end = face.bottomRight as [number, number];
                            if (start && end) {
                                const x = start[0];
                                const y = start[1];
                                const w = end[0] - start[0];
                                const h = end[1] - start[1];

                                ctx.strokeStyle = "#4CAF50";
                                ctx.lineWidth = 3;
                                ctx.strokeRect(x, y, w, h);
                                ctx.fillStyle = "#4CAF50";
                                ctx.font = "16px Inter";
                                ctx.fillText("Actor", x, y - 10);
                            }
                        });
                    }

                    // Draw detected objects
                    if (results?.scene?.start_points) {
                        results.scene.start_points.forEach((bbox: number[], i: number) => {
                            // bbox is [x, y, w, h] from coco-ssd
                            const [x, y, w, h] = bbox;
                            const label = results.scene.objects[i]?.name || "Object";

                            ctx.strokeStyle = "rgba(255, 215, 0, 0.6)";
                            ctx.lineWidth = 2;
                            ctx.strokeRect(x, y, w, h);
                            ctx.fillStyle = "rgba(255, 215, 0, 0.8)";
                            ctx.fillText(label, x, y - 5);
                        });
                    }

                    // Rule of Thirds
                    drawGrid(ctx, canvasRef.current.width, canvasRef.current.height);
                }

                // Analysis Interval
                if (now - lastAnalysisTime >= ANALYSIS_INTERVAL) {
                    lastAnalysisTime = now;
                    performAnalysis();
                }
            }
            animationId = requestAnimationFrame(loop);
        };

        const performAnalysis = async () => {
            if (!videoRef.current || !canvasRef.current) return;

            // Perform parallel analysis
            const [colorResults, framingResults, sceneResults] = await Promise.all([
                Promise.resolve(analyzeColor(videoRef.current, canvasRef.current)),
                analyzeFraming(videoRef.current),
                analyzeScene(videoRef.current)
            ]);

            const newResults = {
                timestamp: new Date().toISOString(),
                color_analysis: colorResults,
                framing: framingResults,
                scene: sceneResults,
                faces: framingResults?.faces || []
            };

            onResults(newResults);
        };

        loop();
        return () => cancelAnimationFrame(animationId);
    }, [isStreaming]); // Removed results dependency to avoid loop reset

    const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(w / 3, 0); ctx.lineTo(w / 3, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(2 * w / 3, 0); ctx.lineTo(2 * w / 3, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, h / 3); ctx.lineTo(w, h / 3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 2 * h / 3); ctx.lineTo(w, 2 * h / 3); ctx.stroke();
        ctx.setLineDash([]);
    };

    return (
        <div className="shared-workspace">
            <div className="workspace-header">
                <div className="header-info">
                    <h2>Analysis Mode: {isStreaming ? "Live" : "Idle"}</h2>
                    <p>Real-time cinematic analysis</p>
                </div>
                <div className="panel-actions">
                    {!isStreaming ? (
                        <button onClick={startCamera} className="btn btn-primary">Start Camera</button>
                    ) : (
                        <button onClick={stopCamera} className="btn btn-secondary">Stop Camera</button>
                    )}
                </div>
            </div>

            <div className="video-container" style={{ position: "relative" }}>
                {!isStreaming && (
                    <div className="video-placeholder">
                        <p>Click "Start Camera" to begin</p>
                    </div>
                )}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{ display: isStreaming ? "block" : "none", width: "100%", borderRadius: "var(--radius-lg)" }}
                />
                <canvas
                    ref={canvasRef}
                    width={1280}
                    height={720}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        pointerEvents: "none",
                        display: isStreaming ? "block" : "none"
                    }}
                />
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Faces Detected</div>
                    <div className="stat-value">{results?.faces?.length || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Frame Rate</div>
                    <div className="stat-value">{fps} FPS</div>
                </div>
            </div>
        </div>
    );
}
