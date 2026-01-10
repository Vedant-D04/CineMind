"use client";

import React, { useState, useEffect, useRef } from "react";

interface TutorialStep {
    title: string;
    description: string;
    target: string;
    position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const tutorialSteps: TutorialStep[] = [
    {
        title: 'Welcome to CineMind!',
        description: 'Advanced AI-powered cinematography and directorial guidance. Let\'s get you started with a quick tour.',
        target: 'center',
        position: 'center'
    },
    {
        title: 'Camera Feed',
        description: 'Start your camera here to begin real-time analysis. The video feed will appear in the main area.',
        target: '#nav-camera',
        position: 'right'
    },
    {
        title: 'Ray AI',
        description: 'Ask Ray for directorial guidance. Inspired by Satyajit Ray, he helps you find the perfect shot.',
        target: '#nav-chat',
        position: 'right'
    },
    {
        title: 'Color Palette',
        description: 'Get intelligent color suggestions based on the scene mood.',
        target: '#nav-color',
        position: 'right'
    },
    {
        title: 'Framing Analysis',
        description: 'Check your composition with rule of thirds, headroom, and looking room guidelines.',
        target: '#nav-framing',
        position: 'right'
    },
    {
        title: 'Scene Analysis',
        description: 'Detect unwanted objects and background clutter to maintain clean, professional shots.',
        target: '#nav-scene',
        position: 'right'
    },
    {
        title: 'Start Analysis',
        description: 'Click this button to start your camera and begin analyzing your footage in real-time!',
        target: 'center',
        position: 'center'
    }
];

export default function Tutorial({ onFinish }: { onFinish: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const [isVisible, setIsVisible] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsVisible(true);
        updateStep(0);

        const handleResize = () => updateStep(currentStep);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        updateStep(currentStep);
        return () => {
            document.querySelectorAll('.tutorial-highlighted').forEach(el => el.classList.remove('tutorial-highlighted'));
        };
    }, [currentStep]);

    const updateStep = (index: number) => {
        // Remove previous highlights
        document.querySelectorAll('.tutorial-highlighted').forEach(el => el.classList.remove('tutorial-highlighted'));

        const step = tutorialSteps[index];

        if (step.position === 'center') {
            setSpotlightStyle({
                top: 0,
                left: 0,
                width: 0,
                height: 0,
                opacity: 0
            });

            requestAnimationFrame(() => {
                if (!tooltipRef.current) return;
                const tooltipRect = tooltipRef.current.getBoundingClientRect();
                setTooltipStyle({
                    top: `calc(50% - ${tooltipRect.height / 2}px)`,
                    left: `calc(50% - ${tooltipRect.width / 2}px)`,
                    opacity: 1,
                    visibility: 'visible'
                });
            });
            return;
        }

        const target = document.querySelector(step.target) as HTMLElement;

        if (!target) {
            console.warn(`Tutorial target not found: ${step.target}`);
            return;
        }

        // Add highlight to current target
        target.classList.add('tutorial-highlighted');

        const rect = target.getBoundingClientRect();

        setSpotlightStyle({
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            borderRadius: '8px',
            opacity: 1
        });

        // Position Tooltip
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
            if (!tooltipRef.current) return;
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const padding = 24;
            let top = 0, left = 0;

            switch (step.position) {
                case 'right':
                    top = rect.top;
                    left = rect.right + padding;
                    break;
                case 'left':
                    top = rect.top;
                    left = rect.left - tooltipRect.width - padding;
                    break;
                case 'bottom':
                    top = rect.bottom + padding;
                    left = rect.left;
                    break;
                case 'top':
                    top = rect.top - tooltipRect.height - padding;
                    left = rect.left;
                    break;
            }

            // Boundary checks
            if (left + tooltipRect.width > window.innerWidth) left = window.innerWidth - tooltipRect.width - 20;
            if (left < 20) left = 20;
            if (top + tooltipRect.height > window.innerHeight) top = window.innerHeight - tooltipRect.height - 20;
            if (top < 20) top = 20;

            setTooltipStyle({
                top: `${top}px`,
                left: `${left}px`,
                opacity: 1,
                visibility: 'visible'
            });
        });
    };

    const next = () => {
        if (currentStep < tutorialSteps.length - 1) {
            setTooltipStyle(prev => ({ ...prev, opacity: 0 })); // Fade out before moving
            setTimeout(() => setCurrentStep(currentStep + 1), 200);
        } else {
            finish();
        }
    };

    const finish = () => {
        document.querySelectorAll('.tutorial-highlighted').forEach(el => el.classList.remove('tutorial-highlighted'));
        setIsVisible(false);
        localStorage.setItem('cinemind-tutorial-seen', 'true');
        setTimeout(onFinish, 300);
    };

    if (!isVisible) return null;

    return (
        <div className={`tutorial-overlay ${isVisible ? 'active' : ''}`}>
            <div className="tutorial-backdrop" onClick={finish}></div>
            <div className="tutorial-spotlight" style={{ ...spotlightStyle, position: 'fixed' }}></div>
            <div
                ref={tooltipRef}
                className="tutorial-tooltip"
                style={{
                    ...tooltipStyle,
                    position: 'fixed'
                }}
            >
                <div className="tooltip-content">
                    <h3>{tutorialSteps[currentStep].title}</h3>
                    <p>{tutorialSteps[currentStep].description}</p>
                    <div className="tooltip-actions">
                        <button className="btn btn-secondary btn-small" onClick={finish}>Skip</button>
                        <div className="tutorial-progress">
                            <span>{currentStep + 1}</span> / <span>{tutorialSteps.length}</span>
                        </div>
                        <button className="btn btn-primary btn-small" onClick={next}>
                            {currentStep === tutorialSteps.length - 1 ? 'start using' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
