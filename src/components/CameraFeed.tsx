"use client";

import React, { useRef, useState, useEffect } from "react";

export default function CameraFeed() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [faces, setFaces] = useState(0);
    const [fps, setFps] = useState(0);

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
    };

    useEffect(() => {
        let animationId: number;
        let frameCount = 0;
        let lastTime = Date.now();

        const loop = () => {
            if (isStreaming) {
                frameCount++;
                const now = Date.now();
                if (now - lastTime >= 1000) {
                    setFps(frameCount);
                    frameCount = 0;
                    lastTime = now;
                }

                // Draw analysis grid (Rule of Thirds)
                if (canvasRef.current && videoRef.current) {
                    const ctx = canvasRef.current.getContext("2d");
                    if (ctx) {
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        drawGrid(ctx, canvasRef.current.width, canvasRef.current.height);
                    }
                }
            }
            animationId = requestAnimationFrame(loop);
        };

        loop();
        return () => cancelAnimationFrame(animationId);
    }, [isStreaming]);

    const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);

        // Vertical
        ctx.beginPath(); ctx.moveTo(w / 3, 0); ctx.lineTo(w / 3, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(2 * w / 3, 0); ctx.lineTo(2 * w / 3, h); ctx.stroke();

        // Horizontal
        ctx.beginPath(); ctx.moveTo(0, h / 3); ctx.lineTo(w, h / 3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 2 * h / 3); ctx.lineTo(w, 2 * h / 3); ctx.stroke();
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
                    <div className="stat-value">{isStreaming ? "1" : "0"}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Frame Rate</div>
                    <div className="stat-value">{fps} FPS</div>
                </div>
            </div>
        </div>
    );
}
